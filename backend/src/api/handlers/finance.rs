use crate::{
    domain::finance::ShippingRateQuoteRequest,
    services::finance_service::{CreateInvoicePayload, FinanceService},
    state::AppState,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use uuid::Uuid;

pub async fn calculate_tariff(Json(payload): Json<ShippingRateQuoteRequest>) -> impl IntoResponse {
    let quote = payload.calculate();
    Json(quote)
}

pub async fn list_invoices(State(state): State<AppState>) -> impl IntoResponse {
    let invoices = FinanceService::list_invoices(&state);
    Json(json!({ "invoices": invoices, "count": invoices.len() }))
}

pub async fn create_invoice(
    State(state): State<AppState>,
    Json(payload): Json<CreateInvoicePayload>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    FinanceService::create_invoice(&state, &actor, payload)
        .map(|inv| (StatusCode::CREATED, Json(inv)))
        .map_err(|err| (StatusCode::BAD_REQUEST, Json(json!({ "error": err }))))
}

pub async fn settle_invoice(
    State(state): State<AppState>,
    Path(invoice_id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actor = state.inner.read().current_user.clone();
    FinanceService::settle_invoice(&state, &actor, invoice_id)
        .map(Json)
        .map_err(|err| (StatusCode::BAD_REQUEST, Json(json!({ "error": err }))))
}
