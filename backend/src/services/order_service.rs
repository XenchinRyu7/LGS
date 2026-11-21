use crate::domain::{
    order::{Address, OrderError, OrderItem, OrderStatus, SalesOrder, ServiceTier},
    rbac::{AuthUser, Permission},
    sod::SodEngine,
    warehouse::StockReservation,
};
use crate::state::AppState;
use chrono::{Duration, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateOrderPayload {
    pub customer_id: String,
    pub customer_name: String,
    pub items: Vec<OrderItem>,
    pub service_tier: ServiceTier,
    pub origin_warehouse_id: String,
    pub delivery_address: Address,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderPayload {
    pub customer_name: Option<String>,
    pub service_tier: Option<ServiceTier>,
    pub delivery_address: Option<Address>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TransitionStatusPayload {
    pub target_status: OrderStatus,
    pub note: Option<String>,
}

pub struct OrderService;

impl OrderService {
    pub fn list_orders(state: &AppState, status_filter: Option<OrderStatus>) -> Vec<SalesOrder> {
        let read = state.inner.read();
        match status_filter {
            Some(status) => read
                .orders
                .iter()
                .filter(|o| o.status == status)
                .cloned()
                .collect(),
            None => read.orders.clone(),
        }
    }

    pub fn get_order_by_id(state: &AppState, id: Uuid) -> Result<SalesOrder, OrderError> {
        let read = state.inner.read();
        read.orders
            .iter()
            .find(|o| o.id == id)
            .cloned()
            .ok_or(OrderError::NotFound(id))
    }

    pub fn create_order(
        state: &AppState,
        actor: &AuthUser,
        payload: CreateOrderPayload,
    ) -> Result<SalesOrder, String> {
        if !actor.has_permission(&Permission::OrderCreate) {
            return Err(format!("RBAC Error: Role {:?} lacks OrderCreate permission", actor.role));
        }

        let order = SalesOrder::new(
            payload.customer_id,
            payload.customer_name,
            payload.items,
            payload.service_tier,
            payload.origin_warehouse_id,
            payload.delivery_address,
            payload.notes,
            Some(actor.user_id),
        )
        .map_err(|e| e.to_string())?;

        {
            let mut write = state.inner.write();
            write.orders.push(order.clone());
        }

        state.record_audit(
            actor,
            "ORDER_CREATED",
            "SalesOrder",
            &order.order_number,
            None,
            Some(format!("Created order {} with total Rp {}", order.order_number, order.total_amount)),
            "127.0.0.1",
        );

        Ok(order)
    }

    pub fn update_order(
        state: &AppState,
        actor: &AuthUser,
        order_id: Uuid,
        payload: UpdateOrderPayload,
    ) -> Result<SalesOrder, String> {
        if !actor.has_permission(&Permission::OrderUpdate) {
            return Err(format!("RBAC Error: Role {:?} lacks OrderUpdate permission", actor.role));
        }

        let mut write = state.inner.write();
        let order = write
            .orders
            .iter_mut()
            .find(|o| o.id == order_id)
            .ok_or_else(|| format!("Order {} not found", order_id))?;

        let before = format!("customer: {}, notes: {:?}", order.customer_name, order.notes);
        order
            .update_details(
                payload.customer_name,
                payload.service_tier,
                payload.delivery_address,
                payload.notes,
            )
            .map_err(|e| e.to_string())?;

        let after = format!("customer: {}, notes: {:?}", order.customer_name, order.notes);
        let updated = order.clone();
        drop(write);

        state.record_audit(
            actor,
            "ORDER_UPDATED",
            "SalesOrder",
            &updated.order_number,
            Some(before),
            Some(after),
            "127.0.0.1",
        );

        Ok(updated)
    }

    pub fn cancel_or_delete_order(
        state: &AppState,
        actor: &AuthUser,
        order_id: Uuid,
    ) -> Result<SalesOrder, String> {
        if !actor.has_permission(&Permission::OrderDelete) {
            return Err(format!("RBAC Error: Role {:?} lacks OrderDelete permission", actor.role));
        }

        let mut write = state.inner.write();
        let order_idx = write
            .orders
            .iter()
            .position(|o| o.id == order_id)
            .ok_or_else(|| format!("Order {} not found", order_id))?;

        let origin_wh = write.orders[order_idx].origin_warehouse_id.clone();
        let items = write.orders[order_idx].items.clone();
        let order_num = write.orders[order_idx].order_number.clone();

        write.orders[order_idx].transition_to(OrderStatus::Cancelled).map_err(|e| e.to_string())?;

        // Release any reserved stock
        for item in &items {
            if let Some(stock) = write
                .stocks
                .iter_mut()
                .find(|s| s.warehouse_id == origin_wh && s.sku == item.sku)
            {
                stock.reserved = stock.reserved.saturating_sub(item.quantity);
            }
        }

        let cancelled = write.orders[order_idx].clone();
        drop(write);

        state.record_audit(
            actor,
            "ORDER_CANCELLED",
            "SalesOrder",
            &order_num,
            Some("Active".to_string()),
            Some("Cancelled - Reserved inventory released".to_string()),
            "127.0.0.1",
        );

        Ok(cancelled)
    }

    /// Atomically reserves stock in the designated warehouse for an order with SoD enforcement
    pub fn reserve_order_inventory(
        state: &AppState,
        actor: &AuthUser,
        order_id: Uuid,
    ) -> Result<SalesOrder, String> {
        if !actor.has_permission(&Permission::OrderReserve) {
            return Err(format!("RBAC Error: Role {:?} lacks OrderReserve permission", actor.role));
        }

        let mut write = state.inner.write();

        let order_idx = write
            .orders
            .iter()
            .position(|o| o.id == order_id)
            .ok_or_else(|| format!("Order {} not found", order_id))?;

        let creator = write.orders[order_idx].created_by;

        // SoD Check: Maker cannot approve/reserve their own order
        if let Err(sod_err) = SodEngine::validate_order_approval(actor, creator, order_id) {
            // Record SoD violation security event in audit trail
            drop(write);
            state.record_audit(
                actor,
                "SOD_VIOLATION_BLOCKED",
                "SalesOrder",
                &order_id.to_string(),
                None,
                Some(sod_err.to_string()),
                "127.0.0.1",
            );
            return Err(sod_err.to_string());
        }

        let current_status = write.orders[order_idx].status.clone();
        if current_status != OrderStatus::Confirmed && current_status != OrderStatus::Draft {
            return Err(format!("Invalid state transition from {:?} to InventoryReserved", current_status));
        }

        let origin_wh = write.orders[order_idx].origin_warehouse_id.clone();
        let items = write.orders[order_idx].items.clone();

        // Verify stock availability atomically
        for item in &items {
            let stock = write
                .stocks
                .iter()
                .find(|s| s.warehouse_id == origin_wh && s.sku == item.sku);

            match stock {
                Some(s) if s.available() >= item.quantity => {}
                _ => return Err(format!("Insufficient stock for SKU {}", item.sku)),
            }
        }

        // Apply reservations
        let now = Utc::now();
        let expires_at = now + Duration::hours(24);

        for item in &items {
            if let Some(stock) = write
                .stocks
                .iter_mut()
                .find(|s| s.warehouse_id == origin_wh && s.sku == item.sku)
            {
                stock.reserved += item.quantity;
            }

            write.reservations.push(StockReservation {
                reservation_id: Uuid::new_v4(),
                order_id,
                warehouse_id: origin_wh.clone(),
                sku: item.sku.clone(),
                quantity: item.quantity,
                expires_at,
                created_at: now,
            });
        }

        write.orders[order_idx].transition_to(OrderStatus::InventoryReserved).map_err(|e| e.to_string())?;
        write.orders[order_idx].approved_by = Some(actor.user_id);
        let updated = write.orders[order_idx].clone();
        drop(write);

        state.record_audit(
            actor,
            "INVENTORY_RESERVED",
            "SalesOrder",
            &updated.order_number,
            Some("Draft/Confirmed".to_string()),
            Some("InventoryReserved - Stock held atomically".to_string()),
            "127.0.0.1",
        );

        Ok(updated)
    }

    pub fn transition_order_status(
        state: &AppState,
        actor: &AuthUser,
        order_id: Uuid,
        next_status: OrderStatus,
    ) -> Result<SalesOrder, String> {
        if !actor.has_permission(&Permission::OrderTransition) {
            return Err(format!("RBAC Error: Role {:?} lacks OrderTransition permission", actor.role));
        }

        let mut write = state.inner.write();

        let order_idx = write
            .orders
            .iter()
            .position(|o| o.id == order_id)
            .ok_or_else(|| format!("Order {} not found", order_id))?;

        let old_status = format!("{:?}", write.orders[order_idx].status);
        write.orders[order_idx].transition_to(next_status.clone()).map_err(|e| e.to_string())?;

        let updated = write.orders[order_idx].clone();
        drop(write);

        state.record_audit(
            actor,
            "ORDER_STATUS_TRANSITION",
            "SalesOrder",
            &updated.order_number,
            Some(old_status),
            Some(format!("{:?}", next_status)),
            "127.0.0.1",
        );

        Ok(updated)
    }
}
