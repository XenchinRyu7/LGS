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
        // IAM, RBAC & SOC-2 Audit Trail
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/auth/logout", post(handlers::auth::logout))
        .route("/api/v1/auth/me", get(handlers::auth::get_current_user))
        .route("/api/v1/auth/switch-role", post(handlers::auth::switch_role))
        .route("/api/v1/audit-trail", get(handlers::auth::list_audit_trail))
        // Analytics
        .route("/api/v1/analytics/overview", get(handlers::analytics::get_overview))
        // Orders Full CRUD
        .route("/api/v1/orders", get(handlers::orders::list_orders).post(handlers::orders::create_order))
        .route(
            "/api/v1/orders/:id",
            get(handlers::orders::get_order)
                .put(handlers::orders::update_order)
                .delete(handlers::orders::delete_order),
        )
        .route("/api/v1/orders/:id/reserve", post(handlers::orders::reserve_stock))
        .route("/api/v1/orders/:id/transition", post(handlers::orders::transition_status))
        // Warehouses & Inventory Full CRUD
        .route("/api/v1/warehouses", get(handlers::warehouses::list_warehouses))
        .route(
            "/api/v1/inventory",
            get(handlers::warehouses::list_stocks).post(handlers::warehouses::create_stock),
        )
        .route("/api/v1/inventory/transfer", post(handlers::warehouses::transfer_stock))
        .route(
            "/api/v1/inventory/opname",
            get(handlers::warehouses::list_opnames).post(handlers::warehouses::record_opname),
        )
        .route("/api/v1/inventory/opname/:audit_id/approve", post(handlers::warehouses::approve_opname))
        // Transport & Fleet Full CRUD
        .route("/api/v1/fleet", get(handlers::transport::list_fleet))
        .route("/api/v1/fleet/vehicles", post(handlers::transport::create_vehicle))
        .route("/api/v1/fleet/drivers", post(handlers::transport::create_driver))
        .route("/api/v1/fleet/dispatch", post(handlers::transport::dispatch_route))
        .route("/api/v1/fleet/pod", post(handlers::transport::submit_pod))
        // Tracking Telemetry
        .route("/api/v1/tracking/:tracking_number", get(handlers::tracking::get_tracking))
        // Finance & Billing Full CRUD
        .route("/api/v1/finance/calculate-rate", post(handlers::finance::calculate_tariff))
        .route(
            "/api/v1/finance/invoices",
            get(handlers::finance::list_invoices).post(handlers::finance::create_invoice),
        )
        .route("/api/v1/finance/invoices/:id/settle", post(handlers::finance::settle_invoice))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
