use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutiveAnalyticsSummary {
    pub total_orders_today: u32,
    pub active_shipments_in_transit: u32,
    pub on_time_delivery_rate_percent: f32, // e.g. 98.4%
    pub fleet_utilization_percent: f32,     // e.g. 87.5%
    pub warehouse_utilization_percent: f32, // e.g. 74.2%
    pub total_revenue_today: f64,
    pub average_fulfillment_time_hours: f32,
    pub temperature_breaches_cold_chain: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThroughputPoint {
    pub label: String,
    pub value: u32,     // Orders processed
    pub secondary: u32, // Orders delivered
}
