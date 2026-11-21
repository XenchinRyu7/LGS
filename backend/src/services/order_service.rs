use crate::domain::{
    order::{Address, OrderError, OrderItem, OrderStatus, SalesOrder, ServiceTier},
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
pub struct TransitionStatusPayload {
    pub target_status: OrderStatus,
    pub actor: Option<String>,
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
        payload: CreateOrderPayload,
    ) -> Result<SalesOrder, OrderError> {
        let order = SalesOrder::new(
            payload.customer_id,
            payload.customer_name,
            payload.items,
            payload.service_tier,
            payload.origin_warehouse_id,
            payload.delivery_address,
            payload.notes,
        )?;

        let mut write = state.inner.write();
        write.orders.push(order.clone());
        Ok(order)
    }

    /// Atomically reserves stock in the designated warehouse for an order
    pub fn reserve_order_inventory(
        state: &AppState,
        order_id: Uuid,
    ) -> Result<SalesOrder, OrderError> {
        let mut write = state.inner.write();

        // 1. Locate order and extract needed info without holding long mutable borrow
        let order_idx = write
            .orders
            .iter()
            .position(|o| o.id == order_id)
            .ok_or(OrderError::NotFound(order_id))?;

        let current_status = write.orders[order_idx].status.clone();
        if current_status != OrderStatus::Confirmed && current_status != OrderStatus::Draft {
            return Err(OrderError::InvalidTransition {
                from: current_status,
                to: OrderStatus::InventoryReserved,
            });
        }

        let origin_wh = write.orders[order_idx].origin_warehouse_id.clone();
        let items = write.orders[order_idx].items.clone();

        // 2. Verify all stock availability atomically
        for item in &items {
            let stock = write
                .stocks
                .iter()
                .find(|s| s.warehouse_id == origin_wh && s.sku == item.sku);

            match stock {
                Some(s) if s.available() >= item.quantity => {}
                _ => return Err(OrderError::InsufficientStock(item.sku.clone())),
            }
        }

        // 3. Apply reservations
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

        write.orders[order_idx].transition_to(OrderStatus::InventoryReserved)?;
        Ok(write.orders[order_idx].clone())
    }

    pub fn transition_order_status(
        state: &AppState,
        order_id: Uuid,
        next_status: OrderStatus,
    ) -> Result<SalesOrder, OrderError> {
        let mut write = state.inner.write();

        let order_idx = write
            .orders
            .iter()
            .position(|o| o.id == order_id)
            .ok_or(OrderError::NotFound(order_id))?;

        write.orders[order_idx].transition_to(next_status.clone())?;

        // If transitioning to cancelled, release reserved stock
        if next_status == OrderStatus::Cancelled {
            let origin_wh = write.orders[order_idx].origin_warehouse_id.clone();
            let items = write.orders[order_idx].items.clone();

            for item in &items {
                if let Some(stock) = write
                    .stocks
                    .iter_mut()
                    .find(|s| s.warehouse_id == origin_wh && s.sku == item.sku)
                {
                    stock.reserved = stock.reserved.saturating_sub(item.quantity);
                }
            }
        }

        Ok(write.orders[order_idx].clone())
    }
}
