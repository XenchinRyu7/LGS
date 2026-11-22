use enterprise_logistics_backend::{
    domain::rbac::{AuthUser, UserRole},
    state::AppState,
};
use uuid::Uuid;

#[allow(dead_code)]
pub fn setup_test_state() -> AppState {
    let state = AppState::new();
    let users = vec![
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap(),
            full_name: "Alexander Hartono (Super Admin)".to_string(),
            email: "alexander.hartono@elgs.ethereal.co.id".to_string(),
            role: UserRole::SuperAdmin,
            department: "Enterprise Operations".to_string(),
        },
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000006").unwrap(),
            full_name: "Hendra Wijaya (Project Manager)".to_string(),
            email: "hendra.wijaya@elgs.ethereal.co.id".to_string(),
            role: UserRole::ProjectManager,
            department: "Supply Chain Solutions & Project Management".to_string(),
        },
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000002").unwrap(),
            full_name: "Diana Puspita (Logistics Manager)".to_string(),
            email: "diana.puspita@elgs.ethereal.co.id".to_string(),
            role: UserRole::LogisticsManager,
            department: "Fulfillment Management".to_string(),
        },
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000003").unwrap(),
            full_name: "Farhan Maulana (Warehouse Lead)".to_string(),
            email: "farhan.maulana@elgs.ethereal.co.id".to_string(),
            role: UserRole::WarehouseOperator,
            department: "Warehouse & Cryo Vault".to_string(),
        },
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000004").unwrap(),
            full_name: "Satria Wicaksono (Fleet Dispatcher)".to_string(),
            email: "satria.wicaksono@elgs.ethereal.co.id".to_string(),
            role: UserRole::FleetDispatcher,
            department: "Fleet Telematics".to_string(),
        },
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000005").unwrap(),
            full_name: "Evelyn Wijaya (Finance Auditor)".to_string(),
            email: "evelyn.wijaya@elgs.ethereal.co.id".to_string(),
            role: UserRole::FinanceAuditor,
            department: "Treasury & Internal Audit".to_string(),
        },
        AuthUser {
            user_id: Uuid::parse_str("00000000-0000-4000-8000-000000000007").unwrap(),
            full_name: "Bambang Pamungkas (Fleet Driver)".to_string(),
            email: "bambang.driver@elgs.ethereal.co.id".to_string(),
            role: UserRole::Driver,
            department: "Ground Operations".to_string(),
        },
    ];
    let mut write = state.inner.write();
    write.current_user = users[1].clone();
    write.users = users;
    drop(write);
    state
}
