use crate::{domain::finance::ShippingRateQuoteRequest, state::AppState};
use axum::{extract::State, response::IntoResponse, Json};
use serde_json::json;

pub async fn calculate_tariff(
    Json(payload): Json<ShippingRateQuoteRequest>,
) -> impl IntoResponse {
    let quote = payload.calculate();
    Json(quote)
}

pub async fn list_invoices(State(state): State<AppState>) -> impl IntoResponse {
    let read = state.inner.read();
    let invoices = read.invoices.clone();
    Json(json!({ "invoices": invoices, "count": invoices.len() }))
}
