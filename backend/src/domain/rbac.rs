use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum UserRole {
    SuperAdmin,
    ProjectManager,
    LogisticsManager,
    WarehouseOperator,
    FleetDispatcher,
    FinanceAuditor,
    Driver,
}

impl UserRole {
    pub fn from_str_opt(s: &str) -> Option<Self> {
        match s {
            "SuperAdmin" => Some(UserRole::SuperAdmin),
            "ProjectManager" => Some(UserRole::ProjectManager),
            "LogisticsManager" => Some(UserRole::LogisticsManager),
            "WarehouseOperator" => Some(UserRole::WarehouseOperator),
            "FleetDispatcher" => Some(UserRole::FleetDispatcher),
            "FinanceAuditor" => Some(UserRole::FinanceAuditor),
            "Driver" => Some(UserRole::Driver),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::SuperAdmin => "SuperAdmin",
            UserRole::ProjectManager => "ProjectManager",
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
            UserRole::ProjectManager => {
                perms.extend([
                    OrderRead,
                    OrderCreate,
                    OrderUpdate,
                    OrderApprove,
                    OrderReserve,
                    OrderTransition,
                    WarehouseRead,
                    WarehouseManage,
                    FleetRead,
                    FleetManage,
                    RouteDispatch,
                    FinanceRead,
                    AuditTrailRead,
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

impl Default for AuthUser {
    fn default() -> Self {
        Self {
            user_id: Uuid::nil(),
            full_name: "ELGS System Account".to_string(),
            email: "system@internal.engine".to_string(),
            role: UserRole::SuperAdmin,
            department: "Enterprise Operations".to_string(),
        }
    }
}
