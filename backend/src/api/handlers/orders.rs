use crate::{
    domain::order::OrderStatus,
    services::order_service::{
        CreateOrderPayload, OrderService, TransitionStatusPayload, UpdateOrderPayload,
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
pub struct OrderQuery {
    pub status: Option<String>,
}

pub async fn list_orders(
    State(state): State<AppState>,
    Query(query): Query<OrderQuery>,
) -> impl IntoResponse {
    let status_filter = query.status.and_then(|s| match s.to_uppercase().as_str() {
        "DRAFT" => Some(OrderStatus::Draft),
        "CONFIRMED" => Some(OrderStatus::Confirmed),
        "INVENTORYRESERVED" => Some(OrderStatus::InventoryReserved),
        "PICKING" => Some(OrderStatus::Picking),
        "PACKED" => Some(OrderStatus::Packed),
        "DISPATCHED" => Some(OrderStatus::Dispatched),
        "INTRANSIT" => Some(OrderStatus::InTransit),
        "OUTFORDELIVERY" => Some(OrderStatus::OutForDelivery),
        "DELIVERED" => Some(OrderStatus::Delivered),
        "FAILEDDELIVERY" => Some(OrderStatus::FailedDelivery),
        "RETURNED" => Some(OrderStatus::Returned),
        "CANCELLED" => Some(OrderStatus::Cancelled),
        _ => None,
    });

    let orders = OrderService::list_orders(&state, status_filter);
    Json(json!({ "orders": orders, "count": orders.len() }))
}

pub async fn get_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    OrderService::get_order_by_id(&state, id)
        .map(Json)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                Json(json!({ "error": e.to_string() })),
            )
        })
}

pub async fn create_order(
    State(state): State<AppState>,
    Json(payload): Json<CreateOrderPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    OrderService::create_order(&state, &actor, payload)
        .map(|order| (StatusCode::CREATED, Json(order)))
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn update_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateOrderPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    OrderService::update_order(&state, &actor, id, payload)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn delete_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    OrderService::cancel_or_delete_order(&state, &actor, id)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn reserve_stock(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    OrderService::reserve_order_inventory(&state, &actor, id)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}

pub async fn transition_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<TransitionStatusPayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    OrderService::transition_order_status(&state, &actor, id, payload.target_status)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))))
}
