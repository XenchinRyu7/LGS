use enterprise_logistics_backend::domain::finance::ShippingRateQuoteRequest;

#[test]
fn test_volumetric_weight_calculation() {
    // 50cm x 40cm x 30cm = 60,000 cm3
    // Standard IATA: 60,000 / 5000 = 12 kg volumetric
    let req = ShippingRateQuoteRequest {
        origin_city: "Jakarta".to_string(),
        destination_city: "Surabaya".to_string(),
        actual_weight_kg: 5.0, // actual weight is lighter than volumetric
        length_cm: 50.0,
        width_cm: 40.0,
        height_cm: 30.0,
        requires_cold_chain: false,
        is_express: false,
    };

    let quote = req.calculate();
    assert_eq!(quote.volumetric_weight_kg, 12.0);
    assert_eq!(quote.chargeable_weight_kg, 12.0); // should charge the 12kg volumetric
    assert!(quote.total_shipping_cost > 0.0);
}

#[test]
fn test_cold_chain_and_express_surcharges() {
    let standard_req = ShippingRateQuoteRequest {
        origin_city: "Jakarta".to_string(),
        destination_city: "Bandung".to_string(),
        actual_weight_kg: 10.0,
        length_cm: 20.0,
        width_cm: 20.0,
        height_cm: 20.0,
        requires_cold_chain: false,
        is_express: false,
    };
    let standard_quote = standard_req.calculate();

    let cold_express_req = ShippingRateQuoteRequest {
        origin_city: "Jakarta".to_string(),
        destination_city: "Bandung".to_string(),
        actual_weight_kg: 10.0,
        length_cm: 20.0,
        width_cm: 20.0,
        height_cm: 20.0,
        requires_cold_chain: true,
        is_express: true,
    };
    let cold_express_quote = cold_express_req.calculate();

    // Cold chain + express must be higher than standard
    assert!(cold_express_quote.cold_chain_surcharge > 0.0);
    assert_eq!(cold_express_quote.express_multiplier, 1.5);
    assert!(cold_express_quote.total_shipping_cost > standard_quote.total_shipping_cost);
}
