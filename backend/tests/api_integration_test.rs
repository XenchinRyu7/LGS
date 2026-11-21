use axum::body::Body;
use axum::http::{Request, StatusCode};
use enterprise_logistics_backend::{api::create_router, state::AppState};
use http_body_util::BodyExt;
use tower::ServiceExt;

#[tokio::test]
async fn test_api_health_check() {
    let state = AppState::new();
    let app = create_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["status"], "healthy");
}

#[tokio::test]
async fn test_api_list_orders_and_warehouses() {
    let state = AppState::new();
    let app = create_router(state);

    // Warehouses
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/warehouses")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(json["warehouses"].as_array().unwrap().len() >= 3);

    // Orders
    let response2 = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/orders")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response2.status(), StatusCode::OK);
    let body2 = response2.into_body().collect().await.unwrap().to_bytes();
    let json2: serde_json::Value = serde_json::from_slice(&body2).unwrap();
    assert!(json2["orders"].as_array().unwrap().len() >= 3);
}

#[tokio::test]
async fn test_api_tracking_query() {
    let state = AppState::new();
    let app = create_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/tracking/TRK-ALPHA01")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["tracking_number"], "TRK-ALPHA01");
    assert!(json["live_telemetry"].is_object());
}
