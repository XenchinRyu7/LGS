use crate::{
    services::warehouse_service::{StockOpnamePayload, StockTransferPayload, WarehouseService},
    state::AppState,
};
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;

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

pub async fn transfer_stock(
    State(state): State<AppState>,
    Json(payload): Json<StockTransferPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    WarehouseService::transfer_stock(&state, payload)
        .map(|transfer| (StatusCode::CREATED, Json(transfer)))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))
}

pub async fn record_opname(
    State(state): State<AppState>,
    Json(payload): Json<StockOpnamePayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    WarehouseService::record_stock_opname(&state, payload)
        .map(|audit| (StatusCode::CREATED, Json(audit)))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))
}
