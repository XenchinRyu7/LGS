use crate::{
    services::transport_service::{
        CreateDriverPayload, CreateVehiclePayload, DispatchRoutePayload, SubmitPoDPayload,
        TransportService,
    },
    state::AppState,
};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;

pub async fn list_fleet(State(state): State<AppState>) -> impl IntoResponse {
    let (vehicles, drivers) = TransportService::list_fleet(&state);
    Json(json!({
        "vehicles": vehicles,
        "drivers": drivers
    }))
}

pub async fn create_vehicle(
    State(state): State<AppState>,
    Json(payload): Json<CreateVehiclePayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    TransportService::create_vehicle(&state, &actor, payload)
        .map(|v| (StatusCode::CREATED, Json(v)))
        .map_err(|err_msg| (StatusCode::BAD_REQUEST, Json(json!({ "error": err_msg }))))
}

pub async fn create_driver(
    State(state): State<AppState>,
    Json(payload): Json<CreateDriverPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    TransportService::create_driver(&state, &actor, payload)
        .map(|d| (StatusCode::CREATED, Json(d)))
        .map_err(|err_msg| (StatusCode::BAD_REQUEST, Json(json!({ "error": err_msg }))))
}

pub async fn dispatch_route(
    State(state): State<AppState>,
    Json(payload): Json<DispatchRoutePayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    TransportService::dispatch_route(&state, &actor, payload)
        .map(|route| (StatusCode::CREATED, Json(route)))
        .map_err(|err_msg| (StatusCode::BAD_REQUEST, Json(json!({ "error": err_msg }))))
}

pub async fn submit_pod(
    State(state): State<AppState>,
    Json(payload): Json<SubmitPoDPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    TransportService::submit_pod(&state, &actor, payload)
        .map(|pod| (StatusCode::CREATED, Json(pod)))
        .map_err(|err_msg| (StatusCode::BAD_REQUEST, Json(json!({ "error": err_msg }))))
}
