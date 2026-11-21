use crate::domain::{
    finance::{Invoice, InvoiceStatus},
    rbac::{AuthUser, Permission},
    sod::SodEngine,
};
use crate::state::AppState;
use chrono::{Duration, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateInvoicePayload {
    pub order_id: Uuid,
    pub customer_id: String,
    pub customer_name: String,
    pub subtotal: f64,
}

pub struct FinanceService;

impl FinanceService {
    pub fn list_invoices(state: &AppState) -> Vec<Invoice> {
        let read = state.inner.read();
        read.invoices.clone()
    }

    pub fn create_invoice(
        state: &AppState,
        actor: &AuthUser,
        payload: CreateInvoicePayload,
    ) -> Result<Invoice, String> {
        if !actor.has_permission(&Permission::InvoiceCreate) {
            return Err(format!("RBAC Error: Role {:?} lacks InvoiceCreate permission", actor.role));
        }

        let tax = payload.subtotal * 0.11; // 11% PPN
        let total = payload.subtotal + tax;
        let invoice_id = Uuid::new_v4();
        let short = &invoice_id.to_string()[..6].to_uppercase();

        let invoice = Invoice {
            invoice_id,
            invoice_number: format!("INV-2026-{}", short),
            order_id: payload.order_id,
            customer_id: payload.customer_id,
            customer_name: payload.customer_name,
            subtotal: payload.subtotal,
            tax_amount: tax,
            total_amount: total,
            status: InvoiceStatus::Issued,
            created_by: Some(actor.user_id),
            settled_by: None,
            due_date: Utc::now() + Duration::days(14),
            created_at: Utc::now(),
        };

        let mut write = state.inner.write();
        write.invoices.push(invoice.clone());
        drop(write);

        state.record_audit(
            actor,
            "INVOICE_CREATED",
            "Invoice",
            &invoice.invoice_number,
            None,
            Some(format!("Issued invoice {} for total Rp {}", invoice.invoice_number, total)),
            "127.0.0.1",
        );

        Ok(invoice)
    }

    pub fn settle_invoice(
        state: &AppState,
        actor: &AuthUser,
        invoice_id: Uuid,
    ) -> Result<Invoice, String> {
        if !actor.has_permission(&Permission::InvoiceSettle) {
            return Err(format!("RBAC Error: Role {:?} lacks InvoiceSettle permission", actor.role));
        }

        let mut write = state.inner.write();
        let inv_idx = write
            .invoices
            .iter()
            .position(|i| i.invoice_id == invoice_id)
            .ok_or_else(|| format!("Invoice {} not found", invoice_id))?;

        let creator = write.invoices[inv_idx].created_by;

        // SoD Check: Invoice creator cannot settle their own invoice
        if let Err(sod_err) = SodEngine::validate_invoice_settlement(actor, creator) {
            drop(write);
            state.record_audit(
                actor,
                "SOD_VIOLATION_BLOCKED",
                "Invoice",
                &invoice_id.to_string(),
                None,
                Some(sod_err.to_string()),
                "127.0.0.1",
            );
            return Err(sod_err.to_string());
        }

        write.invoices[inv_idx].status = InvoiceStatus::Paid;
        write.invoices[inv_idx].settled_by = Some(actor.user_id);
        let settled = write.invoices[inv_idx].clone();
        drop(write);

        state.record_audit(
            actor,
            "INVOICE_SETTLED",
            "Invoice",
            &settled.invoice_number,
            Some("Issued".to_string()),
            Some(format!("Settled and signed off by {}", actor.full_name)),
            "127.0.0.1",
        );

        Ok(settled)
    }
}
