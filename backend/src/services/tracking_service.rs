use crate::domain::tracking::{LiveGpsTelemetry, TrackingTimelineEvent, TrackingView};
use crate::state::AppState;
use chrono::{Duration, Utc};

pub struct TrackingService;

impl TrackingService {
    pub fn get_tracking_view(state: &AppState, tracking_number: &str) -> Option<TrackingView> {
        let read = state.inner.read();
        let order = read.orders.iter().find(|o| o.tracking_number == tracking_number)?;

        let events: Vec<TrackingTimelineEvent> = read
            .tracking_events
            .iter()
            .filter(|e| e.tracking_number == tracking_number)
            .cloned()
            .collect();

        // Simulate live GPS breadcrumb if active
        let live_telemetry = if order.status == crate::domain::order::OrderStatus::InTransit
            || order.status == crate::domain::order::OrderStatus::Dispatched
            || order.status == crate::domain::order::OrderStatus::OutForDelivery
        {
            Some(LiveGpsTelemetry {
                tracking_number: tracking_number.to_string(),
                vehicle_id: "VH-REEFER-01".to_string(),
                driver_name: "Bambang Pamungkas".to_string(),
                latitude: -6.2297,
                longitude: 106.8295,
                speed_kmh: 42.5,
                heading_degrees: 148.0,
                temperature_celsius: Some(-20.2), // Verified cold chain
                battery_fuel_percent: 84,
                eta_minutes: 24,
                timestamp: Utc::now(),
            })
        } else {
            None
        };

        Some(TrackingView {
            tracking_number: tracking_number.to_string(),
            order_number: order.order_number.clone(),
            recipient_name: order.delivery_address.recipient_name.clone(),
            destination_city: order.delivery_address.city.clone(),
            current_status: format!("{:?}", order.status),
            events,
            live_telemetry,
            estimated_delivery: Utc::now() + Duration::hours(2),
        })
    }
}
