pub mod handlers;

use crate::state::AppState;
use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub fn create_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        // Health
        .route("/api/v1/health", get(handlers::health_check))
        // Analytics
        .route("/api/v1/analytics/overview", get(handlers::analytics::get_overview))
        // Orders
        .route("/api/v1/orders", get(handlers::orders::list_orders).post(handlers::orders::create_order))
        .route("/api/v1/orders/:id", get(handlers::orders::get_order))
        .route("/api/v1/orders/:id/reserve", post(handlers::orders::reserve_stock))
        .route("/api/v1/orders/:id/transition", post(handlers::orders::transition_status))
        // Warehouses & Inventory
        .route("/api/v1/warehouses", get(handlers::warehouses::list_warehouses))
        .route("/api/v1/inventory", get(handlers::warehouses::list_stocks))
        .route("/api/v1/inventory/transfer", post(handlers::warehouses::transfer_stock))
        .route("/api/v1/inventory/opname", post(handlers::warehouses::record_opname))
        // Transport & Fleet
        .route("/api/v1/fleet", get(handlers::transport::list_fleet))
        .route("/api/v1/fleet/dispatch", post(handlers::transport::dispatch_route))
        .route("/api/v1/fleet/pod", post(handlers::transport::submit_pod))
        // Tracking
        .route("/api/v1/tracking/:tracking_number", get(handlers::tracking::get_tracking))
        // Finance & Tariffs
        .route("/api/v1/finance/calculate-rate", post(handlers::finance::calculate_tariff))
        .route("/api/v1/finance/invoices", get(handlers::finance::list_invoices))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
