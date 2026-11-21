use enterprise_logistics_backend::domain::order::{
    Address, OrderError, OrderItem, OrderStatus, SalesOrder, ServiceTier,
};

#[test]
fn test_order_valid_lifecycle_progression() {
    let items = vec![OrderItem {
        item_id: uuid::Uuid::new_v4(),
        sku: "TEST-SKU-1".to_string(),
        name: "Test Product".to_string(),
        quantity: 2,
        unit_price: 100_000.0,
        weight_kg: 1.5,
        volume_cbm: 0.005,
    }];

    let address = Address {
        recipient_name: "Customer One".to_string(),
        phone: "08123456789".to_string(),
        street: "Jl. Sudirman 1".to_string(),
        city: "Jakarta".to_string(),
        province: "DKI Jakarta".to_string(),
        postal_code: "10210".to_string(),
        latitude: -6.2,
        longitude: 106.8,
    };

    let mut order = SalesOrder::new(
        "CUST-001".to_string(),
        "Customer PT".to_string(),
        items,
        ServiceTier::Standard,
        "WH-JKT-CENTRAL".to_string(),
        address,
        None,
    )
    .expect("Order creation should succeed");

    assert_eq!(order.status, OrderStatus::Draft);
    assert_eq!(order.total_amount, 200_000.0);
    assert_eq!(order.total_weight_kg, 3.0);

    // Draft -> Confirmed
    assert!(order.transition_to(OrderStatus::Confirmed).is_ok());
    assert_eq!(order.status, OrderStatus::Confirmed);

    // Confirmed -> InventoryReserved
    assert!(order.transition_to(OrderStatus::InventoryReserved).is_ok());
    assert_eq!(order.status, OrderStatus::InventoryReserved);

    // InventoryReserved -> Picking
    assert!(order.transition_to(OrderStatus::Picking).is_ok());

    // Picking -> Packed
    assert!(order.transition_to(OrderStatus::Packed).is_ok());

    // Packed -> Dispatched
    assert!(order.transition_to(OrderStatus::Dispatched).is_ok());

    // Dispatched -> InTransit
    assert!(order.transition_to(OrderStatus::InTransit).is_ok());

    // InTransit -> OutForDelivery
    assert!(order.transition_to(OrderStatus::OutForDelivery).is_ok());

    // OutForDelivery -> Delivered
    assert!(order.transition_to(OrderStatus::Delivered).is_ok());
    assert_eq!(order.status, OrderStatus::Delivered);
}

#[test]
fn test_order_illegal_transitions_rejected() {
    let items = vec![OrderItem {
        item_id: uuid::Uuid::new_v4(),
        sku: "TEST-SKU-1".to_string(),
        name: "Test Product".to_string(),
        quantity: 1,
        unit_price: 50_000.0,
        weight_kg: 0.5,
        volume_cbm: 0.001,
    }];

    let address = Address {
        recipient_name: "Customer Two".to_string(),
        phone: "08123456789".to_string(),
        street: "Jl. Gatot Subroto 2".to_string(),
        city: "Jakarta".to_string(),
        province: "DKI Jakarta".to_string(),
        postal_code: "12710".to_string(),
        latitude: -6.23,
        longitude: 106.82,
    };

    let mut order = SalesOrder::new(
        "CUST-002".to_string(),
        "Customer PT Two".to_string(),
        items,
        ServiceTier::Express,
        "WH-JKT-CENTRAL".to_string(),
        address,
        None,
    )
    .unwrap();

    // Cannot jump from Draft directly to Delivered or Dispatched!
    assert_eq!(
        order.transition_to(OrderStatus::Delivered),
        Err(OrderError::InvalidTransition {
            from: OrderStatus::Draft,
            to: OrderStatus::Delivered,
        })
    );

    assert_eq!(
        order.transition_to(OrderStatus::Dispatched),
        Err(OrderError::InvalidTransition {
            from: OrderStatus::Draft,
            to: OrderStatus::Dispatched,
        })
    );
}

#[test]
fn test_order_cannot_have_zero_quantity_or_empty_items() {
    let address = Address {
        recipient_name: "Customer Three".to_string(),
        phone: "08123456789".to_string(),
        street: "Jl. Asia Afrika".to_string(),
        city: "Bandung".to_string(),
        province: "Jawa Barat".to_string(),
        postal_code: "40111".to_string(),
        latitude: -6.92,
        longitude: 107.61,
    };

    // Empty items
    let res = SalesOrder::new(
        "CUST-003".to_string(),
        "Customer PT Three".to_string(),
        vec![],
        ServiceTier::Standard,
        "WH-BDG-WEST".to_string(),
        address.clone(),
        None,
    );
    assert_eq!(res.unwrap_err(), OrderError::EmptyLineItems);

    // Zero quantity
    let zero_item = vec![OrderItem {
        item_id: uuid::Uuid::new_v4(),
        sku: "ZERO-QTY".to_string(),
        name: "Zero Item".to_string(),
        quantity: 0,
        unit_price: 10_000.0,
        weight_kg: 1.0,
        volume_cbm: 0.01,
    }];
    let res2 = SalesOrder::new(
        "CUST-003".to_string(),
        "Customer PT Three".to_string(),
        zero_item,
        ServiceTier::Standard,
        "WH-BDG-WEST".to_string(),
        address,
        None,
    );
    assert_eq!(res2.unwrap_err(), OrderError::InvalidQuantity);
}
