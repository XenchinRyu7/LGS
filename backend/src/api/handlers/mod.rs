pub mod analytics;
pub mod auth;
pub mod finance;
pub mod orders;
pub mod tracking;
pub mod transport;
pub mod warehouses;

use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "ELGS — Ethereal Logistics Management Engine",
        "version": "2.0.0",
        "architecture": "Enterprise DDD + Axum + Tokio + SoD Enforcer",
        "timestamp": chrono::Utc::now()
    }))
}
