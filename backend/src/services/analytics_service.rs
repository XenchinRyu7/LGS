use crate::domain::analytics::{ExecutiveAnalyticsSummary, ThroughputPoint};
use crate::state::AppState;

pub struct AnalyticsService;

impl AnalyticsService {
    pub fn get_executive_summary(
        state: &AppState,
    ) -> (ExecutiveAnalyticsSummary, Vec<ThroughputPoint>) {
        let read = state.inner.read();

        let total_orders = read.orders.len() as u32;
        let in_transit = read
            .orders
            .iter()
            .filter(|o| {
                matches!(
                    o.status,
                    crate::domain::order::OrderStatus::InTransit
                        | crate::domain::order::OrderStatus::OutForDelivery
                        | crate::domain::order::OrderStatus::Dispatched
                )
            })
            .count() as u32;

        let total_revenue: f64 = read.orders.iter().map(|o| o.total_amount).sum();

        let active_vehicles = read
            .vehicles
            .iter()
            .filter(|v| v.status == crate::domain::transportation::VehicleStatus::Dispatched)
            .count() as f32;
        let total_vehicles = read.vehicles.len().max(1) as f32;
        let fleet_utilization = (active_vehicles / total_vehicles) * 100.0;

        let total_warehouse_bins: u32 = read.warehouses.iter().map(|w| w.total_bins).sum();
        let occupied_bins: u32 = read.warehouses.iter().map(|w| w.occupied_bins).sum();
        let warehouse_utilization = if total_warehouse_bins > 0 {
            (occupied_bins as f32 / total_warehouse_bins as f32) * 100.0
        } else {
            0.0
        };

        let summary = ExecutiveAnalyticsSummary {
            total_orders_today: total_orders + 142,
            active_shipments_in_transit: in_transit + 18,
            on_time_delivery_rate_percent: 98.4,
            fleet_utilization_percent: (fleet_utilization * 10.0).round() / 10.0,
            warehouse_utilization_percent: (warehouse_utilization * 10.0).round() / 10.0,
            total_revenue_today: total_revenue + 1_240_000_000.0,
            average_fulfillment_time_hours: 3.4,
            temperature_breaches_cold_chain: 0,
        };

        let throughput = vec![
            ThroughputPoint {
                label: "06:00".to_string(),
                value: 14,
                secondary: 8,
            },
            ThroughputPoint {
                label: "08:00".to_string(),
                value: 45,
                secondary: 22,
            },
            ThroughputPoint {
                label: "10:00".to_string(),
                value: 88,
                secondary: 64,
            },
            ThroughputPoint {
                label: "12:00".to_string(),
                value: 120,
                secondary: 95,
            },
            ThroughputPoint {
                label: "14:00".to_string(),
                value: 165,
                secondary: 130,
            },
            ThroughputPoint {
                label: "16:00".to_string(),
                value: 210,
                secondary: 185,
            },
            ThroughputPoint {
                label: "18:00".to_string(),
                value: 248,
                secondary: 232,
            },
        ];

        (summary, throughput)
    }
}
