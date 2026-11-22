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

#[tokio::test]
async fn test_api_auth_login_and_logout() {
    let state = AppState::new().with_test_users();
    let app = create_router(state);

    // 1. Valid Login
    let payload = serde_json::json!({
        "email": "hendra.wijaya@elgs.ethereal.co.id"
    });
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(&payload).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["user"]["role"], "ProjectManager");
    assert_eq!(json["user"]["email"], "hendra.wijaya@elgs.ethereal.co.id");
    assert!(json["token"].is_string());

    // 2. Dynamic Register
    let reg_payload = serde_json::json!({
        "full_name": "Reza Rahadian",
        "email": "reza.rahadian@elgs.ethereal.co.id",
        "role": "FleetDispatcher",
        "department": "Transport Logistics"
    });
    let reg_resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(&reg_payload).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    let reg_body = reg_resp.into_body().collect().await.unwrap().to_bytes();
    let reg_json: serde_json::Value = serde_json::from_slice(&reg_body).unwrap();
    assert_eq!(
        reg_json["user"]["email"],
        "reza.rahadian@elgs.ethereal.co.id"
    );
    assert_eq!(reg_json["user"]["role"], "FleetDispatcher");

    // 3. Domain validation rejection
    let invalid_domain_payload = serde_json::json!({
        "full_name": "Hacker Imposter",
        "email": "hacker@gmail.com",
        "role": "SuperAdmin"
    });
    let reject_resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_vec(&invalid_domain_payload).unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reject_resp.status(), StatusCode::BAD_REQUEST);

    // 4. Logout
    let logout_resp = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/auth/logout")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout_resp.status(), StatusCode::OK);
}
