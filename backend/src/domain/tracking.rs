use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingTimelineEvent {
    pub event_id: Uuid,
    pub tracking_number: String,
    pub status: String,
    pub location_name: String,
    pub description: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveGpsTelemetry {
    pub tracking_number: String,
    pub vehicle_id: String,
    pub driver_name: String,
    pub latitude: f64,
    pub longitude: f64,
    pub speed_kmh: f64,
    pub heading_degrees: f32,
    pub temperature_celsius: Option<f32>, // Important for cold-chain vaccines/produce
    pub battery_fuel_percent: u8,
    pub eta_minutes: u32,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingView {
    pub tracking_number: String,
    pub order_number: String,
    pub recipient_name: String,
    pub destination_city: String,
    pub current_status: String,
    pub events: Vec<TrackingTimelineEvent>,
    pub live_telemetry: Option<LiveGpsTelemetry>,
    pub estimated_delivery: DateTime<Utc>,
}
