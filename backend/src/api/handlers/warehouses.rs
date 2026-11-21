use crate::{
    services::warehouse_service::{
        CreateStockPayload, StockOpnamePayload, StockTransferPayload, WarehouseService,
    },
    state::AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct StockQuery {
    pub warehouse_id: Option<String>,
}

pub async fn list_warehouses(State(state): State<AppState>) -> impl IntoResponse {
    let warehouses = WarehouseService::list_warehouses(&state);
    Json(json!({ "warehouses": warehouses, "count": warehouses.len() }))
}

pub async fn list_stocks(
    State(state): State<AppState>,
    Query(query): Query<StockQuery>,
) -> impl IntoResponse {
    let stocks = WarehouseService::list_stocks(&state, query.warehouse_id);
    Json(json!({ "inventory": stocks, "count": stocks.len() }))
}

pub async fn create_stock(
    State(state): State<AppState>,
    Json(payload): Json<CreateStockPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    WarehouseService::create_stock_item(&state, &actor, payload)
        .map(|stock| (StatusCode::CREATED, Json(stock)))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn transfer_stock(
    State(state): State<AppState>,
    Json(payload): Json<StockTransferPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    WarehouseService::transfer_stock(&state, &actor, payload)
        .map(|transfer| (StatusCode::CREATED, Json(transfer)))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn record_opname(
    State(state): State<AppState>,
    Json(payload): Json<StockOpnamePayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    WarehouseService::record_stock_opname(&state, &actor, payload)
        .map(|audit| (StatusCode::CREATED, Json(audit)))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn approve_opname(
    State(state): State<AppState>,
    Path(audit_id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    WarehouseService::approve_stock_opname(&state, &actor, audit_id)
        .map(|audit| Json(audit))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn list_opnames(State(state): State<AppState>) -> impl IntoResponse {
    let audits = WarehouseService::list_opnames(&state);
    Json(json!({ "opnames": audits, "count": audits.len() }))
}
