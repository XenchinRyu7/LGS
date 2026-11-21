use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum StorageZone {
    Ambient,
    ColdStorage,
    HighValueSecure,
    HazardousGoods,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinLocation {
    pub bin_code: String,
    pub zone: StorageZone,
    pub max_capacity_kg: f64,
    pub current_load_kg: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WarehouseStock {
    pub sku: String,
    pub name: String,
    pub warehouse_id: String,
    pub bin_code: String,
    pub on_hand: u32,
    pub reserved: u32,
    pub zone: StorageZone,
    pub unit_weight_kg: f64,
}

impl WarehouseStock {
    pub fn available(&self) -> u32 {
        self.on_hand.saturating_sub(self.reserved)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Warehouse {
    pub id: String,
    pub name: String,
    pub city: String,
    pub province: String,
    pub total_bins: u32,
    pub occupied_bins: u32,
    pub active_personnel: u32,
    pub supports_cold_chain: bool,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockReservation {
    pub reservation_id: Uuid,
    pub order_id: Uuid,
    pub warehouse_id: String,
    pub sku: String,
    pub quantity: u32,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockTransferRequest {
    pub transfer_id: Uuid,
    pub from_warehouse: String,
    pub to_warehouse: String,
    pub sku: String,
    pub quantity: u32,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockOpnameAudit {
    pub audit_id: Uuid,
    pub warehouse_id: String,
    pub sku: String,
    pub system_count: u32,
    pub physical_count: u32,
    pub discrepancy: i32,
    pub counted_by: Uuid,
    pub approved_by: Option<Uuid>,
    pub status: String, // "PENDING_APPROVAL", "APPROVED", "REJECTED"
    pub notes: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum WarehouseError {
    #[error("Warehouse not found: {0}")]
    WarehouseNotFound(String),
    #[error("Stock not found for SKU: {0}")]
    StockNotFound(String),
    #[error("Insufficient available stock for SKU {sku}. Needed {needed}, available {available}")]
    InsufficientStock {
        sku: String,
        needed: u32,
        available: u32,
    },
    #[error("Bin {0} exceeded capacity limit")]
    BinOvercapacity(String),
    #[error("Audit record not found: {0}")]
    AuditNotFound(Uuid),
    #[error("Audit record {0} has already been resolved with status {1}")]
    AuditAlreadyResolved(Uuid, String),
}
