use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum UserRole {
    SuperAdmin,
    LogisticsManager,
    WarehouseOperator,
    FleetDispatcher,
    FinanceAuditor,
    Driver,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::SuperAdmin => "SuperAdmin",
            UserRole::LogisticsManager => "LogisticsManager",
            UserRole::WarehouseOperator => "WarehouseOperator",
            UserRole::FleetDispatcher => "FleetDispatcher",
            UserRole::FinanceAuditor => "FinanceAuditor",
            UserRole::Driver => "Driver",
        }
    }

    pub fn permissions(&self) -> HashSet<Permission> {
        use Permission::*;
        let mut perms = HashSet::new();

        match self {
            UserRole::SuperAdmin => {
                perms.extend([
                    OrderRead,
                    OrderCreate,
                    OrderUpdate,
                    OrderDelete,
                    OrderApprove,
                    OrderReserve,
                    OrderTransition,
                    WarehouseRead,
                    WarehouseManage,
                    StockOpnameSubmit,
                    StockOpnameApprove,
                    FleetRead,
                    FleetManage,
                    RouteDispatch,
                    PodSubmit,
                    FinanceRead,
                    InvoiceCreate,
                    InvoiceSettle,
                    AuditTrailRead,
                    SecurityAdmin,
                ]);
            }
            UserRole::LogisticsManager => {
                perms.extend([
                    OrderRead,
                    OrderCreate,
                    OrderUpdate,
                    OrderApprove,
                    OrderReserve,
                    OrderTransition,
                    WarehouseRead,
                    WarehouseManage,
                    StockOpnameSubmit,
                    StockOpnameApprove,
                    FleetRead,
                    RouteDispatch,
                    FinanceRead,
                    AuditTrailRead,
                ]);
            }
            UserRole::WarehouseOperator => {
                perms.extend([
                    OrderRead,
                    OrderReserve,
                    OrderTransition,
                    WarehouseRead,
                    StockOpnameSubmit,
                ]);
            }
            UserRole::FleetDispatcher => {
                perms.extend([OrderRead, FleetRead, FleetManage, RouteDispatch]);
            }
            UserRole::FinanceAuditor => {
                perms.extend([
                    OrderRead,
                    FinanceRead,
                    InvoiceCreate,
                    InvoiceSettle,
                    AuditTrailRead,
                ]);
            }
            UserRole::Driver => {
                perms.extend([OrderRead, FleetRead, PodSubmit]);
            }
        }
        perms
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Permission {
    OrderRead,
    OrderCreate,
    OrderUpdate,
    OrderDelete,
    OrderApprove,
    OrderReserve,
    OrderTransition,
    WarehouseRead,
    WarehouseManage,
    StockOpnameSubmit,
    StockOpnameApprove,
    FleetRead,
    FleetManage,
    RouteDispatch,
    PodSubmit,
    FinanceRead,
    InvoiceCreate,
    InvoiceSettle,
    AuditTrailRead,
    SecurityAdmin,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub full_name: String,
    pub email: String,
    pub role: UserRole,
    pub department: String,
}

impl AuthUser {
    pub fn has_permission(&self, permission: &Permission) -> bool {
        self.role.permissions().contains(permission)
    }
}
