use enterprise_logistics_backend::{
    domain::{
        order::{Address, OrderItem, ServiceTier},
        rbac::UserRole,
    },
    services::{
        order_service::{CreateOrderPayload, OrderService},
        warehouse_service::{StockOpnamePayload, WarehouseService},
    },
    state::AppState,
};

#[test]
fn test_sod_order_maker_checker_rule_enforced() {
    let state = AppState::new().with_test_users();

    // 1. LogisticsManager Diana creates an order
    let manager = state
        .inner
        .read()
        .users
        .iter()
        .find(|u| u.role == UserRole::LogisticsManager)
        .unwrap()
        .clone();

    let payload = CreateOrderPayload {
        customer_id: "CUST-SOD-01".to_string(),
        customer_name: "PT SoD Test Corp".to_string(),
        items: vec![OrderItem {
            item_id: uuid::Uuid::new_v4(),
            sku: "MED-VAC-001".to_string(),
            name: "Vaccine Pack".to_string(),
            quantity: 10,
            unit_price: 350_000.0,
            weight_kg: 0.8,
            volume_cbm: 0.002,
        }],
        service_tier: ServiceTier::Standard,
        origin_warehouse_id: "WH-JKT-CENTRAL".to_string(),
        delivery_address: Address {
            recipient_name: "Budi Recipient".to_string(),
            phone: "08123456".to_string(),
            street: "Jl. SoD Test 1".to_string(),
            city: "Jakarta".to_string(),
            province: "DKI".to_string(),
            postal_code: "10110".to_string(),
            latitude: -6.2,
            longitude: 106.8,
        },
        notes: None,
    };

    let order = OrderService::create_order(&state, &manager, payload).unwrap();
    assert_eq!(order.created_by, Some(manager.user_id));

    // 2. Diana tries to approve/reserve her OWN order -> VIOLATION BLOCKED!
    let self_reserve_result = OrderService::reserve_order_inventory(&state, &manager, order.id);
    assert!(self_reserve_result.is_err());
    let err_msg = self_reserve_result.unwrap_err();
    assert!(
        err_msg.contains("SoD Violation: Maker-Checker rule breached"),
        "Expected Maker-Checker SoD error, got: {}",
        err_msg
    );

    // 3. SuperAdmin approves the order -> SUCCEEDS!
    let admin = state
        .inner
        .read()
        .users
        .iter()
        .find(|u| u.role == UserRole::SuperAdmin)
        .unwrap()
        .clone();

    let admin_reserve = OrderService::reserve_order_inventory(&state, &admin, order.id);
    assert!(
        admin_reserve.is_ok(),
        "SuperAdmin must be able to approve dual-control orders"
    );
}

#[test]
fn test_sod_opname_self_approval_blocked() {
    let state = AppState::new().with_test_users();

    // 1. LogisticsManager Diana logs physical stock count (Manager has both submit and approve perms)
    let manager = state
        .inner
        .read()
        .users
        .iter()
        .find(|u| u.role == UserRole::LogisticsManager)
        .unwrap()
        .clone();

    let opname_payload = StockOpnamePayload {
        warehouse_id: "WH-JKT-CENTRAL".to_string(),
        sku: "MED-VAC-001".to_string(),
        physical_count: 1250, // Variance: +50 units
        notes: Some("Physical count count-sheet verified".to_string()),
    };

    let audit = WarehouseService::record_stock_opname(&state, &manager, opname_payload).unwrap();
    assert_eq!(audit.status, "PENDING_APPROVAL");
    assert_eq!(audit.counted_by, manager.user_id);

    // 2. Diana attempts to approve her OWN variance reconciliation -> BLOCKED by SoD!
    let self_approval = WarehouseService::approve_stock_opname(&state, &manager, audit.audit_id);
    assert!(self_approval.is_err());
    let err = self_approval.unwrap_err();
    assert!(
        err.contains("SoD Violation: Warehouse Opname Dual Control"),
        "Expected Opname self-approval error, got: {}",
        err
    );

    // 3. SuperAdmin approves the variance -> RECONCILED!
    let admin = state
        .inner
        .read()
        .users
        .iter()
        .find(|u| u.role == UserRole::SuperAdmin)
        .unwrap()
        .clone();

    let approved = WarehouseService::approve_stock_opname(&state, &admin, audit.audit_id).unwrap();
    assert_eq!(approved.status, "APPROVED");
    assert_eq!(approved.approved_by, Some(admin.user_id));
}

#[test]
fn test_soc2_audit_trail_immutable_logging() {
    let state = AppState::new().with_test_users();

    let initial_count = state.inner.read().audit_logs.len();
    assert!(initial_count > 0, "Initial bootstrap audit logs must exist");

    // Perform an action
    let admin = state.inner.read().users[0].clone();
    state.record_audit(
        &admin,
        "TEST_ACTION",
        "TestResource",
        "TR-001",
        Some("old".to_string()),
        Some("new".to_string()),
        "127.0.0.1",
    );

    let read = state.inner.read();
    assert_eq!(read.audit_logs.len(), initial_count + 1);
    let latest = read.audit_logs.last().unwrap();
    assert_eq!(latest.action, "TEST_ACTION");
    assert!(
        !latest.hash_signature.is_empty(),
        "Cryptographic hash signature must be present"
    );
}
