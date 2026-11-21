use crate::domain::warehouse::{
    StockOpnameAudit, StockTransferRequest, Warehouse, WarehouseError, WarehouseStock,
};
use crate::state::AppState;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct StockTransferPayload {
    pub from_warehouse: String,
    pub to_warehouse: String,
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Deserialize)]
pub struct StockOpnamePayload {
    pub warehouse_id: String,
    pub sku: String,
    pub physical_count: u32,
    pub auditor_name: String,
}

pub struct WarehouseService;

impl WarehouseService {
    pub fn list_warehouses(state: &AppState) -> Vec<Warehouse> {
        let read = state.inner.read();
        read.warehouses.clone()
    }

    pub fn list_stocks(state: &AppState, warehouse_id: Option<String>) -> Vec<WarehouseStock> {
        let read = state.inner.read();
        match warehouse_id {
            Some(w_id) => read
                .stocks
                .iter()
                .filter(|s| s.warehouse_id == w_id)
                .cloned()
                .collect(),
            None => read.stocks.clone(),
        }
    }

    pub fn transfer_stock(
        state: &AppState,
        payload: StockTransferPayload,
    ) -> Result<StockTransferRequest, WarehouseError> {
        let mut write = state.inner.write();

        // 1. Check origin stock
        let origin_stock = write
            .stocks
            .iter_mut()
            .find(|s| s.warehouse_id == payload.from_warehouse && s.sku == payload.sku)
            .ok_or_else(|| WarehouseError::StockNotFound(payload.sku.clone()))?;

        if origin_stock.available() < payload.quantity {
            return Err(WarehouseError::InsufficientStock {
                sku: payload.sku.clone(),
                needed: payload.quantity,
                available: origin_stock.available(),
            });
        }

        // Deduct from origin on-hand
        origin_stock.on_hand -= payload.quantity;
        let origin_name = origin_stock.name.clone();
        let origin_zone = origin_stock.zone.clone();
        let origin_weight = origin_stock.unit_weight_kg;

        // 2. Add or create in destination stock
        if let Some(dest_stock) = write
            .stocks
            .iter_mut()
            .find(|s| s.warehouse_id == payload.to_warehouse && s.sku == payload.sku)
        {
            dest_stock.on_hand += payload.quantity;
        } else {
            write.stocks.push(WarehouseStock {
                sku: payload.sku.clone(),
                name: origin_name,
                warehouse_id: payload.to_warehouse.clone(),
                bin_code: "RECEIVING-BAY-01".to_string(),
                on_hand: payload.quantity,
                reserved: 0,
                zone: origin_zone,
                unit_weight_kg: origin_weight,
            });
        }

        let transfer = StockTransferRequest {
            transfer_id: Uuid::new_v4(),
            from_warehouse: payload.from_warehouse,
            to_warehouse: payload.to_warehouse,
            sku: payload.sku,
            quantity: payload.quantity,
            status: "COMPLETED".to_string(),
            created_at: Utc::now(),
        };

        write.stock_transfers.push(transfer.clone());
        Ok(transfer)
    }

    pub fn record_stock_opname(
        state: &AppState,
        payload: StockOpnamePayload,
    ) -> Result<StockOpnameAudit, WarehouseError> {
        let mut write = state.inner.write();

        let stock = write
            .stocks
            .iter_mut()
            .find(|s| s.warehouse_id == payload.warehouse_id && s.sku == payload.sku)
            .ok_or_else(|| WarehouseError::StockNotFound(payload.sku.clone()))?;

        let system_count = stock.on_hand;
        let discrepancy = payload.physical_count as i32 - system_count as i32;

        // Adjust system stock to physical count
        stock.on_hand = payload.physical_count;

        let audit = StockOpnameAudit {
            audit_id: Uuid::new_v4(),
            warehouse_id: payload.warehouse_id,
            sku: payload.sku,
            system_count,
            physical_count: payload.physical_count,
            discrepancy,
            auditor_name: payload.auditor_name,
            timestamp: Utc::now(),
        };

        write.stock_opnames.push(audit.clone());
        Ok(audit)
    }
}
