use crate::{
    domain::{
        finance::InvoiceStatus,
        order::{Address, OrderItem, OrderStatus, SalesOrder, ServiceTier},
        rbac::{AuthUser, UserRole},
        sod::SodEngine,
        tracking::LiveGpsTelemetry,
    },
    state::sandbox::SandboxState,
    state::AppState,
};
use axum::{
    extract::{Path, State},
    http::{HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

/// Helper to generate standard ELGS Developer Sandbox response with enterprise headers
fn sandbox_response<T: Serialize>(status: StatusCode, data: T) -> Response {
    let mut headers = HeaderMap::new();
    headers.insert("X-ELGS-Environment", HeaderValue::from_static("sandbox"));
    headers.insert("X-Database-Write", HeaderValue::from_static("skipped"));
    headers.insert("X-Sandbox-Mode", HeaderValue::from_static("active"));
    headers.insert(
        "Access-Control-Expose-Headers",
        HeaderValue::from_static("X-ELGS-Environment, X-Database-Write, X-Sandbox-Mode"),
    );
    (status, headers, Json(data)).into_response()
}

// -----------------------------------------------------------------------------
// 1. Sandbox Status & Meta
// -----------------------------------------------------------------------------
pub async fn get_sandbox_status() -> impl IntoResponse {
    sandbox_response(
        StatusCode::OK,
        json!({
            "environment": "sandbox",
            "status": "operational",
            "version": "2.0.0-sandbox",
            "engine": "ELGS Sandbox Developer Engine",
            "persistence": "in-memory (no database writes)",
            "database_protection": "STRICT_ISOLATION_ACTIVE",
            "features": {
                "order_simulation": true,
                "telematics_streaming": true,
                "sod_maker_checker": true,
                "tariff_engine": true,
                "mock_invoice_settlement": true,
                "auto_tracking_generator": true
            },
            "timestamp": Utc::now()
        }),
    )
}

// -----------------------------------------------------------------------------
// 2. Developer Sandbox Token Generator
// -----------------------------------------------------------------------------
#[derive(Debug, Deserialize)]
pub struct SandboxTokenRequest {
    pub role: Option<String>,
    pub developer_id: Option<String>,
    pub client_id: Option<String>,
}

pub async fn generate_sandbox_token(Json(payload): Json<SandboxTokenRequest>) -> impl IntoResponse {
    let role = payload.role.unwrap_or_else(|| "SuperAdmin".to_string());
    let dev_id = payload
        .developer_id
        .unwrap_or_else(|| "dev_ethereal_sbx".to_string());
    let token = format!(
        "elgs_sbx_{}_{}",
        role.to_lowercase(),
        Uuid::new_v4().simple()
    );

    sandbox_response(
        StatusCode::OK,
        json!({
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": 86400,
            "environment": "sandbox",
            "developer_id": dev_id,
            "role": role,
            "permissions": ["*"],
            "notes": "Sandbox developer token valid across all /api/v1/sandbox/* endpoints"
        }),
    )
}

// -----------------------------------------------------------------------------
// 3. Orders Simulation (CRUD & Lifecycle)
// -----------------------------------------------------------------------------
pub async fn list_sandbox_orders(State(state): State<AppState>) -> impl IntoResponse {
    let sb = state.sandbox.read();
    sandbox_response(
        StatusCode::OK,
        json!({
            "orders": sb.orders,
            "total_count": sb.orders.len(),
            "simulated": true,
            "db_persisted": false
        }),
    )
}

#[derive(Debug, Deserialize)]
pub struct CreateSandboxItemInput {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub unit_price: f64,
    pub weight_kg: f64,
    pub volume_cbm: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateSandboxOrderPayload {
    pub customer_id: String,
    pub customer_name: String,
    pub service_tier: ServiceTier,
    pub origin_warehouse_id: String,
    pub delivery_address: Address,
    pub items: Vec<CreateSandboxItemInput>,
    pub notes: Option<String>,
}

pub async fn create_sandbox_order(
    State(state): State<AppState>,
    Json(payload): Json<CreateSandboxOrderPayload>,
) -> impl IntoResponse {
    let order_id = Uuid::new_v4();
    let tracking_num = format!(
        "SBX-TRK-{}",
        Uuid::new_v4().simple().to_string()[..8].to_uppercase()
    );

    let mut total_amount = 0.0;
    let mut total_weight = 0.0;
    let mut order_items = Vec::new();

    for item in payload.items {
        total_amount += item.unit_price * (item.quantity as f64);
        total_weight += item.weight_kg * (item.quantity as f64);
        order_items.push(OrderItem {
            item_id: Uuid::new_v4(),
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            weight_kg: item.weight_kg,
            volume_cbm: item.volume_cbm,
        });
    }

    // Add service tier surcharge for sandbox simulation
    let tier_multiplier = match payload.service_tier {
        ServiceTier::ColdChainPriority => 1.5,
        ServiceTier::Express => 1.25,
        ServiceTier::Standard => 1.0,
        ServiceTier::SameDay => 1.75,
    };
    let calculated_freight = (total_weight * 12500.0 * tier_multiplier).max(50000.0);

    let order = SalesOrder {
        id: order_id,
        order_number: format!(
            "ORD-SBX-{}",
            Uuid::new_v4().simple().to_string()[..6].to_uppercase()
        ),
        customer_id: payload.customer_id,
        customer_name: payload.customer_name,
        status: OrderStatus::Draft,
        service_tier: payload.service_tier,
        origin_warehouse_id: payload.origin_warehouse_id,
        delivery_address: payload.delivery_address,
        items: order_items,
        tracking_number: tracking_num,
        total_amount: total_amount + calculated_freight,
        total_weight_kg: total_weight,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        created_by: Some(Uuid::new_v4()),
        approved_by: None,
        notes: payload.notes,
    };

    {
        let mut sb = state.sandbox.write();
        sb.orders.insert(0, order.clone());
    }

    sandbox_response(
        StatusCode::CREATED,
        json!({
            "message": "Sandbox order created successfully (in-memory simulation)",
            "simulated": true,
            "db_persisted": false,
            "calculated_freight_idr": calculated_freight,
            "order": order
        }),
    )
}

pub async fn get_sandbox_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let sb = state.sandbox.read();
    if let Some(order) = sb.orders.iter().find(|o| o.id == id) {
        sandbox_response(StatusCode::OK, json!(order))
    } else {
        sandbox_response(
            StatusCode::NOT_FOUND,
            json!({ "error": "Sandbox order not found", "order_id": id }),
        )
    }
}

#[derive(Debug, Deserialize)]
pub struct TransitionSandboxOrderPayload {
    pub target_status: OrderStatus,
    pub actor_role: Option<String>,
    pub actor_id: Option<Uuid>,
    pub notes: Option<String>,
}

pub async fn transition_sandbox_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<TransitionSandboxOrderPayload>,
) -> impl IntoResponse {
    let mut sb = state.sandbox.write();
    let actor_id = payload.actor_id.unwrap_or_else(Uuid::new_v4);
    let role_str = payload
        .actor_role
        .unwrap_or_else(|| "ProjectManager".to_string());
    let role = UserRole::from_str_opt(&role_str).unwrap_or(UserRole::ProjectManager);

    let actor = AuthUser {
        user_id: actor_id,
        full_name: "Sandbox Operator".to_string(),
        email: "sandbox@elgs.ethereal.co.id".to_string(),
        role,
        department: "Sandbox Quality Assurance".to_string(),
    };

    if let Some(order) = sb.orders.iter_mut().find(|o| o.id == id) {
        // Enforce state transition rules
        if !order.status.can_transition_to(&payload.target_status) {
            return sandbox_response(
                StatusCode::BAD_REQUEST,
                json!({
                    "error": "Invalid state transition",
                    "from": order.status,
                    "to": payload.target_status,
                    "simulated": true
                }),
            );
        }

        // Enforce Maker-Checker SoD validation on approval/confirmation
        if payload.target_status == OrderStatus::Confirmed {
            if let Err(sod_err) =
                SodEngine::validate_order_approval(&actor, order.created_by, order.id)
            {
                return sandbox_response(
                    StatusCode::FORBIDDEN,
                    json!({
                        "error": "SoD (Segregation of Duties) Violation",
                        "reason": sod_err.to_string(),
                        "simulated": true
                    }),
                );
            }
            order.approved_by = Some(actor_id);
        }

        let old_status = order.status.clone();
        order.status = payload.target_status;
        order.updated_at = Utc::now();

        sandbox_response(
            StatusCode::OK,
            json!({
                "message": "Sandbox order status updated successfully",
                "simulated": true,
                "db_persisted": false,
                "order_id": order.id,
                "previous_status": old_status,
                "current_status": order.status,
                "approved_by": order.approved_by,
                "notes": payload.notes
            }),
        )
    } else {
        sandbox_response(
            StatusCode::NOT_FOUND,
            json!({ "error": "Sandbox order not found", "order_id": id }),
        )
    }
}

// -----------------------------------------------------------------------------
// 4. Cold Chain & GPS Tracking Telematics Simulation
// -----------------------------------------------------------------------------
pub async fn get_sandbox_tracking(
    State(state): State<AppState>,
    Path(tracking_number): Path<String>,
) -> impl IntoResponse {
    let sb = state.sandbox.read();
    let order = sb
        .orders
        .iter()
        .find(|o| o.tracking_number == tracking_number);

    let is_cold_chain = order
        .map(|o| o.service_tier == ServiceTier::ColdChainPriority)
        .unwrap_or(true);

    let temperature_c: f32 = if is_cold_chain { -72.4 } else { 24.5 };

    let telemetry = LiveGpsTelemetry {
        tracking_number: tracking_number.clone(),
        vehicle_id: "veh-sbx-001".to_string(),
        driver_name: "Bambang Sandbox".to_string(),
        latitude: -6.4258,
        longitude: 107.1852,
        speed_kmh: 68.4,
        heading_degrees: 115.0,
        temperature_celsius: Some(temperature_c),
        battery_fuel_percent: 82,
        eta_minutes: 45,
        timestamp: Utc::now(),
    };

    sandbox_response(
        StatusCode::OK,
        json!({
            "tracking_number": tracking_number,
            "status": order.map(|o| format!("{:?}", o.status)).unwrap_or_else(|| "InTransit".to_string()),
            "simulated": true,
            "db_persisted": false,
            "telemetry": telemetry,
            "assigned_vehicle": {
                "plate_number": "B 9000 SBX",
                "vehicle_type": "ReeferColdTruck (32T)",
                "carrier": "ELGS Cold-Chain Fleet"
            },
            "assigned_driver": {
                "name": "Bambang Sandbox",
                "phone": "+62 811-9999-0001",
                "rating": 4.95
            },
            "timeline": sb.tracking_events
        }),
    )
}

// -----------------------------------------------------------------------------
// 5. Warehouses & Stock Opname Simulation
// -----------------------------------------------------------------------------
pub async fn list_sandbox_warehouses(State(state): State<AppState>) -> impl IntoResponse {
    let sb = state.sandbox.read();
    sandbox_response(
        StatusCode::OK,
        json!({
            "warehouses": sb.warehouses,
            "stocks": sb.stocks,
            "simulated": true,
            "db_persisted": false
        }),
    )
}

#[derive(Debug, Deserialize)]
pub struct SimulateStockOpnamePayload {
    pub warehouse_id: String,
    pub sku: String,
    pub system_count: i32,
    pub physical_count: i32,
    pub counted_by_role: String,
}

pub async fn simulate_stock_opname(
    Json(payload): Json<SimulateStockOpnamePayload>,
) -> impl IntoResponse {
    let discrepancy = payload.physical_count - payload.system_count;
    let requires_executive_signoff = discrepancy.abs() > 50;

    sandbox_response(
        StatusCode::OK,
        json!({
            "audit_id": Uuid::new_v4(),
            "warehouse_id": payload.warehouse_id,
            "sku": payload.sku,
            "system_count": payload.system_count,
            "physical_count": payload.physical_count,
            "discrepancy": discrepancy,
            "reconciliation_status": if discrepancy == 0 { "BALANCED" } else { "DISCREPANCY_FLAGGED" },
            "requires_executive_signoff": requires_executive_signoff,
            "sod_rule": "Counter cannot approve reconciliation (Maker-Checker Enforced)",
            "simulated": true,
            "db_persisted": false
        }),
    )
}

// -----------------------------------------------------------------------------
// 6. Billing & Invoice Settlement Simulation
// -----------------------------------------------------------------------------
#[derive(Debug, Deserialize)]
pub struct SettleInvoicePayload {
    pub invoice_id: Uuid,
    pub payment_method: String,
    pub amount_paid: f64,
}

pub async fn simulate_invoice_settlement(
    State(state): State<AppState>,
    Json(payload): Json<SettleInvoicePayload>,
) -> impl IntoResponse {
    let mut sb = state.sandbox.write();
    let tx_hash = format!("0xsbx_tx_{}", Uuid::new_v4().simple());

    if let Some(inv) = sb
        .invoices
        .iter_mut()
        .find(|i| i.invoice_id == payload.invoice_id)
    {
        inv.status = InvoiceStatus::Paid;
        inv.settled_by = Some(Uuid::new_v4());

        sandbox_response(
            StatusCode::OK,
            json!({
                "message": "Sandbox invoice settled successfully",
                "invoice_id": inv.invoice_id,
                "invoice_number": inv.invoice_number,
                "status": "Paid",
                "settled_by": inv.settled_by,
                "simulated_payment_gateway": {
                    "method": payload.payment_method,
                    "amount_received": payload.amount_paid,
                    "transaction_hash": tx_hash,
                    "settlement_status": "COMPLETED"
                },
                "simulated": true,
                "db_persisted": false
            }),
        )
    } else {
        sandbox_response(
            StatusCode::NOT_FOUND,
            json!({ "error": "Sandbox invoice not found", "invoice_id": payload.invoice_id }),
        )
    }
}

// -----------------------------------------------------------------------------
// 7. Reset Sandbox Session
// -----------------------------------------------------------------------------
pub async fn reset_sandbox(State(state): State<AppState>) -> impl IntoResponse {
    let mut sb = state.sandbox.write();
    *sb = SandboxState::new();

    sandbox_response(
        StatusCode::OK,
        json!({
            "message": "Sandbox state has been reset to pristine baseline fixtures",
            "environment": "sandbox",
            "simulated": true,
            "db_persisted": false,
            "orders_count": sb.orders.len(),
            "warehouses_count": sb.warehouses.len(),
            "stocks_count": sb.stocks.len(),
            "timestamp": Utc::now()
        }),
    )
}
