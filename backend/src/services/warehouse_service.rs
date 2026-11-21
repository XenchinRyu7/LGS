use crate::domain::{
    rbac::{AuthUser, Permission},
    sod::SodEngine,
    warehouse::{StockOpnameAudit, StockTransferRequest, StorageZone, Warehouse, WarehouseStock},
};
use crate::state::AppState;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateStockPayload {
    pub sku: String,
    pub name: String,
    pub warehouse_id: String,
    pub bin_code: String,
    pub initial_quantity: u32,
    pub zone: StorageZone,
    pub unit_weight_kg: f64,
}

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
    pub notes: Option<String>,
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

    pub fn create_stock_item(
        state: &AppState,
        actor: &AuthUser,
        payload: CreateStockPayload,
    ) -> Result<WarehouseStock, String> {
        if !actor.has_permission(&Permission::WarehouseManage) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks WarehouseManage permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();
        if write
            .stocks
            .iter()
            .any(|s| s.sku == payload.sku && s.warehouse_id == payload.warehouse_id)
        {
            return Err(format!(
                "Stock for SKU {} already exists in warehouse {}",
                payload.sku, payload.warehouse_id
            ));
        }

        let stock = WarehouseStock {
            sku: payload.sku.clone(),
            name: payload.name.clone(),
            warehouse_id: payload.warehouse_id.clone(),
            bin_code: payload.bin_code,
            on_hand: payload.initial_quantity,
            reserved: 0,
            zone: payload.zone,
            unit_weight_kg: payload.unit_weight_kg,
        };

        write.stocks.push(stock.clone());
        drop(write);

        state.record_audit(
            actor,
            "SKU_CREATED",
            "WarehouseStock",
            &payload.sku,
            None,
            Some(format!(
                "Created SKU {} in {}",
                payload.sku, payload.warehouse_id
            )),
            "127.0.0.1",
        );

        Ok(stock)
    }

    pub fn transfer_stock(
        state: &AppState,
        actor: &AuthUser,
        payload: StockTransferPayload,
    ) -> Result<StockTransferRequest, String> {
        if !actor.has_permission(&Permission::WarehouseManage) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks WarehouseManage permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();

        let origin_stock = write
            .stocks
            .iter_mut()
            .find(|s| s.warehouse_id == payload.from_warehouse && s.sku == payload.sku)
            .ok_or_else(|| format!("Stock not found for SKU: {}", payload.sku))?;

        if origin_stock.available() < payload.quantity {
            return Err(format!(
                "Insufficient stock for SKU {}. Needed {}, available {}",
                payload.sku,
                payload.quantity,
                origin_stock.available()
            ));
        }

        origin_stock.on_hand -= payload.quantity;
        let origin_name = origin_stock.name.clone();
        let origin_zone = origin_stock.zone.clone();
        let origin_weight = origin_stock.unit_weight_kg;

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
            from_warehouse: payload.from_warehouse.clone(),
            to_warehouse: payload.to_warehouse.clone(),
            sku: payload.sku.clone(),
            quantity: payload.quantity,
            status: "COMPLETED".to_string(),
            created_at: Utc::now(),
        };

        write.stock_transfers.push(transfer.clone());
        drop(write);

        state.record_audit(
            actor,
            "STOCK_TRANSFER",
            "WarehouseStock",
            &payload.sku,
            Some(format!("Transferred from {}", payload.from_warehouse)),
            Some(format!(
                "Moved {} units to {}",
                payload.quantity, payload.to_warehouse
            )),
            "127.0.0.1",
        );

        Ok(transfer)
    }

    /// Step 1: Warehouse Operator logs physical stock count (Maker)
    pub fn record_stock_opname(
        state: &AppState,
        actor: &AuthUser,
        payload: StockOpnamePayload,
    ) -> Result<StockOpnameAudit, String> {
        if !actor.has_permission(&Permission::StockOpnameSubmit) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks StockOpnameSubmit permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();

        let stock = write
            .stocks
            .iter()
            .find(|s| s.warehouse_id == payload.warehouse_id && s.sku == payload.sku)
            .ok_or_else(|| format!("Stock not found for SKU: {}", payload.sku))?;

        let system_count = stock.on_hand;
        let discrepancy = payload.physical_count as i32 - system_count as i32;

        let audit = StockOpnameAudit {
            audit_id: Uuid::new_v4(),
            warehouse_id: payload.warehouse_id.clone(),
            sku: payload.sku.clone(),
            system_count,
            physical_count: payload.physical_count,
            discrepancy,
            counted_by: actor.user_id,
            approved_by: None,
            status: "PENDING_APPROVAL".to_string(),
            notes: payload.notes,
            timestamp: Utc::now(),
        };

        write.stock_opnames.push(audit.clone());
        drop(write);

        state.record_audit(
            actor,
            "STOCK_OPNAME_SUBMITTED",
            "StockOpnameAudit",
            &audit.audit_id.to_string(),
            Some(format!("System on-hand count: {}", system_count)),
            Some(format!(
                "Physical count: {}, Discrepancy: {}",
                payload.physical_count, discrepancy
            )),
            "127.0.0.1",
        );

        Ok(audit)
    }

    /// Step 2: Separate Auditor or Manager approves the Opname variance (Checker) with SoD verification
    pub fn approve_stock_opname(
        state: &AppState,
        actor: &AuthUser,
        audit_id: Uuid,
    ) -> Result<StockOpnameAudit, String> {
        if !actor.has_permission(&Permission::StockOpnameApprove) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks StockOpnameApprove permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();

        let audit_idx = write
            .stock_opnames
            .iter()
            .position(|a| a.audit_id == audit_id)
            .ok_or_else(|| format!("Audit record {} not found", audit_id))?;

        let counted_by = write.stock_opnames[audit_idx].counted_by;
        let audit_status = write.stock_opnames[audit_idx].status.clone();

        if audit_status != "PENDING_APPROVAL" {
            return Err(format!(
                "Audit {} has already been finalized ({})",
                audit_id, audit_status
            ));
        }

        // SoD Check: Count submitter cannot approve reconciliation
        if let Err(sod_err) = SodEngine::validate_opname_approval(actor, counted_by) {
            drop(write);
            state.record_audit(
                actor,
                "SOD_VIOLATION_BLOCKED",
                "StockOpnameAudit",
                &audit_id.to_string(),
                None,
                Some(sod_err.to_string()),
                "127.0.0.1",
            );
            return Err(sod_err.to_string());
        }

        let warehouse_id = write.stock_opnames[audit_idx].warehouse_id.clone();
        let sku = write.stock_opnames[audit_idx].sku.clone();
        let physical_count = write.stock_opnames[audit_idx].physical_count;

        // Apply reconciled count to inventory
        if let Some(stock) = write
            .stocks
            .iter_mut()
            .find(|s| s.warehouse_id == warehouse_id && s.sku == sku)
        {
            stock.on_hand = physical_count;
        }

        write.stock_opnames[audit_idx].status = "APPROVED".to_string();
        write.stock_opnames[audit_idx].approved_by = Some(actor.user_id);
        let resolved = write.stock_opnames[audit_idx].clone();
        drop(write);

        state.record_audit(
            actor,
            "STOCK_OPNAME_APPROVED",
            "StockOpnameAudit",
            &resolved.audit_id.to_string(),
            Some("PENDING_APPROVAL".to_string()),
            Some(format!(
                "Approved by {}. Inventory updated to {} units",
                actor.full_name, physical_count
            )),
            "127.0.0.1",
        );

        Ok(resolved)
    }

    pub fn list_opnames(state: &AppState) -> Vec<StockOpnameAudit> {
        let read = state.inner.read();
        read.stock_opnames.clone()
    }
}
