use crate::{services::analytics_service::AnalyticsService, state::AppState};
use axum::{extract::State, response::IntoResponse, Json};
use serde_json::json;

pub async fn get_overview(State(state): State<AppState>) -> impl IntoResponse {
    let (summary, throughput) = AnalyticsService::get_executive_summary(&state);
    Json(json!({
        "metrics": summary,
        "throughput": throughput
    }))
}
