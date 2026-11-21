use crate::domain::{
    order::OrderStatus,
    transportation::{
        DeliveryRoute, Driver, DriverStatus, ProofOfDelivery, Vehicle, VehicleStatus, Waypoint,
    },
};
use crate::state::AppState;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct DispatchRoutePayload {
    pub driver_id: String,
    pub vehicle_id: String,
    pub origin_warehouse_id: String,
    pub order_ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct SubmitPoDPayload {
    pub order_id: Uuid,
    pub recipient_name: String,
    pub relationship: String,
    pub signature_hash: String,
    pub photo_url: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
}

pub struct TransportService;

impl TransportService {
    pub fn list_fleet(state: &AppState) -> (Vec<Vehicle>, Vec<Driver>) {
        let read = state.inner.read();
        (read.vehicles.clone(), read.drivers.clone())
    }

    pub fn dispatch_route(
        state: &AppState,
        payload: DispatchRoutePayload,
    ) -> Result<DeliveryRoute, String> {
        let mut write = state.inner.write();

        // Validate driver & vehicle
        let driver = write
            .drivers
            .iter_mut()
            .find(|d| d.id == payload.driver_id)
            .ok_or_else(|| format!("Driver {} not found", payload.driver_id))?;
        driver.status = DriverStatus::OnRoute;
        driver.assigned_vehicle_id = Some(payload.vehicle_id.clone());

        let vehicle = write
            .vehicles
            .iter_mut()
            .find(|v| v.id == payload.vehicle_id)
            .ok_or_else(|| format!("Vehicle {} not found", payload.vehicle_id))?;
        vehicle.status = VehicleStatus::Dispatched;

        // Build route waypoints from orders
        let mut waypoints = Vec::new();
        let now = Utc::now();

        for (idx, order_id) in payload.order_ids.iter().enumerate() {
            if let Some(order) = write.orders.iter_mut().find(|o| o.id == *order_id) {
                order.status = OrderStatus::Dispatched;
                waypoints.push(Waypoint {
                    sequence: (idx + 1) as u32,
                    order_id: Some(*order_id),
                    address_label: format!("{}, {}", order.delivery_address.street, order.delivery_address.city),
                    latitude: order.delivery_address.latitude,
                    longitude: order.delivery_address.longitude,
                    estimated_arrival: now + chrono::Duration::minutes((30 * (idx + 1)) as i64),
                    completed: false,
                });
            }
        }

        let route_id = Uuid::new_v4();
        let route = DeliveryRoute {
            route_id,
            route_code: format!("RTE-{}", &route_id.to_string()[..6].to_uppercase()),
            driver_id: payload.driver_id,
            vehicle_id: payload.vehicle_id,
            origin_warehouse_id: payload.origin_warehouse_id,
            waypoints,
            total_distance_km: 34.8,
            status: "ACTIVE".to_string(),
            departure_time: Some(now),
            completion_time: None,
        };

        write.routes.push(route.clone());
        Ok(route)
    }

    pub fn submit_pod(state: &AppState, payload: SubmitPoDPayload) -> Result<ProofOfDelivery, String> {
        let mut write = state.inner.write();

        let order = write
            .orders
            .iter_mut()
            .find(|o| o.id == payload.order_id)
            .ok_or_else(|| format!("Order {} not found", payload.order_id))?;

        order.status = OrderStatus::Delivered;
        order.updated_at = Utc::now();

        let pod = ProofOfDelivery {
            pod_id: Uuid::new_v4(),
            order_id: payload.order_id,
            tracking_number: order.tracking_number.clone(),
            recipient_name: payload.recipient_name,
            relationship: payload.relationship,
            signature_hash: payload.signature_hash,
            photo_url: payload.photo_url,
            latitude: payload.latitude,
            longitude: payload.longitude,
            delivered_at: Utc::now(),
        };

        write.pods.push(pod.clone());
        Ok(pod)
    }
}
