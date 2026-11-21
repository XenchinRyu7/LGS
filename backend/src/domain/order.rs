use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderStatus {
    Draft,
    Confirmed,
    InventoryReserved,
    Picking,
    Packed,
    Dispatched,
    InTransit,
    OutForDelivery,
    Delivered,
    FailedDelivery,
    Returned,
    Cancelled,
}

impl OrderStatus {
    pub fn can_transition_to(&self, target: &OrderStatus) -> bool {
        use OrderStatus::*;
        match (self, target) {
            // Cancellation rules
            (Draft | Confirmed | InventoryReserved, Cancelled) => true,
            // Progression
            (Draft, Confirmed) => true,
            (Draft | Confirmed, InventoryReserved) => true,
            (InventoryReserved, Picking) => true,
            (Picking, Packed) => true,
            (Packed, Dispatched) => true,
            (Dispatched, InTransit) => true,
            (InTransit, OutForDelivery) => true,
            (OutForDelivery, Delivered) => true,
            (OutForDelivery, FailedDelivery) => true,
            (FailedDelivery, OutForDelivery) => true, // Re-attempt delivery
            (FailedDelivery, Returned) => true,     // Returned to hub
            // Terminal states
            (Delivered, Returned) => true,          // RMA reverse logistics
            _ => false,
        }
    }
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum OrderError {
    #[error("Invalid state transition from {from:?} to {to:?}")]
    InvalidTransition { from: OrderStatus, to: OrderStatus },
    #[error("Order has no line items")]
    EmptyLineItems,
    #[error("Item quantity must be greater than zero")]
    InvalidQuantity,
    #[error("Order not found: {0}")]
    NotFound(Uuid),
    #[error("Insufficient stock for SKU {0}")]
    InsufficientStock(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ServiceTier {
    Standard,
    Express,
    SameDay,
    ColdChainPriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderItem {
    pub item_id: Uuid,
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub unit_price: f64,
    pub weight_kg: f64,
    pub volume_cbm: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub recipient_name: String,
    pub phone: String,
    pub street: String,
    pub city: String,
    pub province: String,
    pub postal_code: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesOrder {
    pub id: Uuid,
    pub order_number: String,
    pub customer_id: String,
    pub customer_name: String,
    pub items: Vec<OrderItem>,
    pub status: OrderStatus,
    pub service_tier: ServiceTier,
    pub origin_warehouse_id: String,
    pub delivery_address: Address,
    pub tracking_number: String,
    pub total_amount: f64,
    pub total_weight_kg: f64,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl SalesOrder {
    pub fn new(
        customer_id: String,
        customer_name: String,
        items: Vec<OrderItem>,
        service_tier: ServiceTier,
        origin_warehouse_id: String,
        delivery_address: Address,
        notes: Option<String>,
    ) -> Result<Self, OrderError> {
        if items.is_empty() {
            return Err(OrderError::EmptyLineItems);
        }
        for item in &items {
            if item.quantity == 0 {
                return Err(OrderError::InvalidQuantity);
            }
        }

        let id = Uuid::new_v4();
        let short_id = &id.to_string()[..8].to_uppercase();
        let order_number = format!("ORD-{}-{}", Utc::now().format("%Y%m%d"), short_id);
        let tracking_number = format!("TRK-{}", short_id);

        let total_amount: f64 = items.iter().map(|i| i.quantity as f64 * i.unit_price).sum();
        let total_weight_kg: f64 = items.iter().map(|i| i.quantity as f64 * i.weight_kg).sum();
        let now = Utc::now();

        Ok(Self {
            id,
            order_number,
            customer_id,
            customer_name,
            items,
            status: OrderStatus::Draft,
            service_tier,
            origin_warehouse_id,
            delivery_address,
            tracking_number,
            total_amount,
            total_weight_kg,
            notes,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn transition_to(&mut self, next: OrderStatus) -> Result<(), OrderError> {
        if !self.status.can_transition_to(&next) {
            return Err(OrderError::InvalidTransition {
                from: self.status.clone(),
                to: next,
            });
        }
        self.status = next;
        self.updated_at = Utc::now();
        Ok(())
    }
}
