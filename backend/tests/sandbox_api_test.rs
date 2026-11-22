use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use enterprise_logistics_backend::{api::create_router, state::AppState};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

#[tokio::test]
async fn test_sandbox_status_and_headers() {
    let state = AppState::new();
    let app = create_router(state);

    let req = Request::builder()
        .uri("/api/v1/sandbox/status")
        .method("GET")
        .body(Body::empty())
        .unwrap();

    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(res.headers().get("X-ELGS-Environment").unwrap(), "sandbox");
    assert_eq!(res.headers().get("X-Database-Write").unwrap(), "skipped");
    assert_eq!(res.headers().get("X-Sandbox-Mode").unwrap(), "active");

    let body = res.into_body().collect().await.unwrap().to_bytes();
    let json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["environment"], "sandbox");
    assert_eq!(json["status"], "operational");
}

#[tokio::test]
async fn test_sandbox_order_simulation_flow() {
    let state = AppState::new();
    let app = create_router(state);

    // 1. Generate sandbox token
    let token_req = Request::builder()
        .uri("/api/v1/sandbox/auth/token")
        .method("POST")
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "role": "SuperAdmin",
                "developer_id": "dev_test_42"
            })
            .to_string(),
        ))
        .unwrap();

    let token_res = app.clone().oneshot(token_req).await.unwrap();
    assert_eq!(token_res.status(), StatusCode::OK);

    // 2. Create sandbox order
    let create_req = Request::builder()
        .uri("/api/v1/sandbox/orders")
        .method("POST")
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "customer_id": "CUST-SBX-001",
                "customer_name": "Sandbox Biotech Client",
                "service_tier": "ColdChainPriority",
                "origin_warehouse_id": "WH-SBX-CGK-01",
                "delivery_address": {
                    "recipient_name": "Dr. Testing",
                    "phone": "+62 811-1234-5678",
                    "street": "Jl. Pasteur No. 12",
                    "city": "Bandung",
                    "province": "Jawa Barat",
                    "postal_code": "40161",
                    "latitude": -6.9034,
                    "longitude": 107.6186
                },
                "items": [
                    {
                        "sku": "SBX-BIO-VAC-001",
                        "name": "Bio-Vaccine",
                        "quantity": 100,
                        "unit_price": 250000.0,
                        "weight_kg": 0.25,
                        "volume_cbm": 0.001
                    }
                ],
                "notes": "Cold chain simulation test"
            })
            .to_string(),
        ))
        .unwrap();

    let create_res = app.clone().oneshot(create_req).await.unwrap();
    assert_eq!(create_res.status(), StatusCode::CREATED);
    assert_eq!(
        create_res.headers().get("X-Database-Write").unwrap(),
        "skipped"
    );

    let create_body = create_res.into_body().collect().await.unwrap().to_bytes();
    let create_json: Value = serde_json::from_slice(&create_body).unwrap();
    let order_id = create_json["order"]["id"].as_str().unwrap();
    let tracking_num = create_json["order"]["tracking_number"].as_str().unwrap();

    // 3. Query sandbox tracking telemetry
    let track_req = Request::builder()
        .uri(format!("/api/v1/sandbox/tracking/{}", tracking_num))
        .method("GET")
        .body(Body::empty())
        .unwrap();

    let track_res = app.clone().oneshot(track_req).await.unwrap();
    assert_eq!(track_res.status(), StatusCode::OK);

    // 4. Transition status
    let trans_req = Request::builder()
        .uri(format!("/api/v1/sandbox/orders/{}/transition", order_id))
        .method("POST")
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "target_status": "Confirmed",
                "actor_role": "SuperAdmin",
                "notes": "Approved in sandbox"
            })
            .to_string(),
        ))
        .unwrap();

    let trans_res = app.clone().oneshot(trans_req).await.unwrap();
    assert_eq!(trans_res.status(), StatusCode::OK);

    // 5. Reset sandbox
    let reset_req = Request::builder()
        .uri("/api/v1/sandbox/reset")
        .method("POST")
        .body(Body::empty())
        .unwrap();

    let reset_res = app.oneshot(reset_req).await.unwrap();
    assert_eq!(reset_res.status(), StatusCode::OK);
}
