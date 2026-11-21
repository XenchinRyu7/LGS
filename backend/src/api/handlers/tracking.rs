use crate::{services::tracking_service::TrackingService, state::AppState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;

pub async fn get_tracking(
    State(state): State<AppState>,
    Path(tracking_number): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    TrackingService::get_tracking_view(&state, &tracking_number)
        .map(Json)
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(
                    json!({ "error": format!("Tracking number '{}' not found", tracking_number) }),
                ),
            )
        })
}
