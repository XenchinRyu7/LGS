use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum VehicleType {
    MotorcycleCargo,
    ElectricVan,
    ReeferColdTruck,
    HeavyDutyTrailer,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum VehicleStatus {
    Available,
    Dispatched,
    InMaintenance,
    OffDuty,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vehicle {
    pub id: String, // e.g. "VH-TRK-001"
    pub license_plate: String,
    pub vehicle_type: VehicleType,
    pub max_payload_kg: f64,
    pub current_payload_kg: f64,
    pub status: VehicleStatus,
    pub fuel_battery_level_percent: u8,
    pub odometer_km: f64,
    pub current_lat: f64,
    pub current_lng: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DriverStatus {
    Ready,
    OnRoute,
    Resting,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Driver {
    pub id: String, // e.g. "DRV-101"
    pub name: String,
    pub phone: String,
    pub license_type: String,
    pub status: DriverStatus,
    pub rating: f32,
    pub assigned_vehicle_id: Option<String>,
    pub consecutive_driving_hours: f32,
    pub fatigue_warning: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Waypoint {
    pub sequence: u32,
    pub order_id: Option<Uuid>,
    pub address_label: String,
    pub latitude: f64,
    pub longitude: f64,
    pub estimated_arrival: DateTime<Utc>,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryRoute {
    pub route_id: Uuid,
    pub route_code: String,
    pub driver_id: String,
    pub vehicle_id: String,
    pub origin_warehouse_id: String,
    pub waypoints: Vec<Waypoint>,
    pub total_distance_km: f64,
    pub status: String, // "PLANNED", "ACTIVE", "COMPLETED"
    pub departure_time: Option<DateTime<Utc>>,
    pub completion_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofOfDelivery {
    pub pod_id: Uuid,
    pub order_id: Uuid,
    pub tracking_number: String,
    pub recipient_name: String,
    pub relationship: String, // e.g. "Self", "Security", "Receptionist"
    pub signature_hash: String,
    pub photo_url: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
    pub delivered_at: DateTime<Utc>,
}
