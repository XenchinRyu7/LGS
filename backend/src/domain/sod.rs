use crate::domain::rbac::{AuthUser, UserRole};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SodError {
    #[error("SoD Violation: Maker-Checker rule breached. Actor {actor_id} cannot approve their own created order {order_id}.")]
    OrderMakerCheckerViolation { actor_id: Uuid, order_id: Uuid },

    #[error("SoD Violation: Warehouse Opname Dual Control. Operator {operator_id} who logged the physical count cannot approve the variance reconciliation.")]
    OpnameSelfApprovalViolation { operator_id: Uuid },

    #[error("SoD Violation: Finance Dual Control. Invoice creator {creator_id} cannot authorize/settle payment for the invoice.")]
    FinanceDualControlViolation { creator_id: Uuid },

    #[error("SoD Violation: Fleet Dispatcher cannot act as recipient signing Proof of Delivery.")]
    DispatchPoDViolation { dispatcher_id: Uuid },

    #[error("RBAC Permission Denied: Role {role:?} lacks permission {permission}.")]
    PermissionDenied { role: UserRole, permission: String },
}

pub struct SodEngine;

impl SodEngine {
    /// Validates Maker-Checker rule on Order confirmation & dispatch
    pub fn validate_order_approval(actor: &AuthUser, creator_id: Option<Uuid>, order_id: Uuid) -> Result<(), SodError> {
        if let Some(c_id) = creator_id {
            // If the same person created the order, they cannot approve/dispatch it themselves
            if actor.user_id == c_id && actor.role != UserRole::SuperAdmin {
                return Err(SodError::OrderMakerCheckerViolation {
                    actor_id: actor.user_id,
                    order_id,
                });
            }
        }
        Ok(())
    }

    /// Validates Dual-Control on Stock Opname Discrepancy Reconciliation
    pub fn validate_opname_approval(actor: &AuthUser, counted_by: Uuid) -> Result<(), SodError> {
        if actor.user_id == counted_by && actor.role != UserRole::SuperAdmin {
            return Err(SodError::OpnameSelfApprovalViolation {
                operator_id: actor.user_id,
            });
        }
        Ok(())
    }

    /// Validates Dual-Control on Invoice Payment Settlement
    pub fn validate_invoice_settlement(actor: &AuthUser, created_by: Option<Uuid>) -> Result<(), SodError> {
        if let Some(c_id) = created_by {
            if actor.user_id == c_id && actor.role != UserRole::SuperAdmin {
                return Err(SodError::FinanceDualControlViolation {
                    creator_id: actor.user_id,
                });
            }
        }
        Ok(())
    }
}
