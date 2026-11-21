use enterprise_logistics_backend::{
    domain::order::{Address, OrderItem, ServiceTier},
    services::order_service::{CreateOrderPayload, OrderService},
    state::AppState,
};

#[tokio::test]
async fn test_concurrent_stock_reservation_integrity() {
    let state = AppState::new();

    // Create 5 orders requesting 50 units each of MED-VAC-001 (initial on_hand 1200, reserved 150 -> available 1050)
    let handles: Vec<_> = (0..5)
        .map(|idx| {
            let state_clone = state.clone();
            tokio::spawn(async move {
                let payload = CreateOrderPayload {
                    customer_id: format!("CONCURRENT-CUST-{}", idx),
                    customer_name: format!("Hospital {}", idx),
                    items: vec![OrderItem {
                        item_id: uuid::Uuid::new_v4(),
                        sku: "MED-VAC-001".to_string(),
                        name: "Bio-Pharmaceutical Vaccine Pack (-20C)".to_string(),
                        quantity: 50,
                        unit_price: 350_000.0,
                        weight_kg: 0.8,
                        volume_cbm: 0.002,
                    }],
                    service_tier: ServiceTier::ColdChainPriority,
                    origin_warehouse_id: "WH-JKT-CENTRAL".to_string(),
                    delivery_address: Address {
                        recipient_name: format!("Dr. Recipient {}", idx),
                        phone: "08111222333".to_string(),
                        street: "Jl. Kesehatan 1".to_string(),
                        city: "Jakarta".to_string(),
                        province: "DKI Jakarta".to_string(),
                        postal_code: "10110".to_string(),
                        latitude: -6.2,
                        longitude: 106.8,
                    },
                    notes: None,
                };

                let order = OrderService::create_order(&state_clone, payload).unwrap();
                OrderService::reserve_order_inventory(&state_clone, order.id)
            })
        })
        .collect();

    for handle in handles {
        let res = handle.await.unwrap();
        assert!(res.is_ok(), "Concurrent reservation must succeed within limits");
    }

    // Verify atomic state: 150 original + (5 * 50 = 250) = 400 reserved
    let read = state.inner.read();
    let vaccine_stock = read
        .stocks
        .iter()
        .find(|s| s.sku == "MED-VAC-001" && s.warehouse_id == "WH-JKT-CENTRAL")
        .unwrap();

    assert_eq!(vaccine_stock.reserved, 400);
    assert_eq!(vaccine_stock.available(), 800);
}
