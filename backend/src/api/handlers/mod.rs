pub mod analytics;
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
        "service": "NexusLogistics Enterprise Engine",
        "version": "1.0.0",
        "timestamp": chrono::Utc::now()
    }))
}
