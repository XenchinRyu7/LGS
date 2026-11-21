use crate::domain::{
    order::OrderStatus,
    rbac::{AuthUser, Permission},
    transportation::{
        DeliveryRoute, Driver, DriverStatus, ProofOfDelivery, Vehicle, VehicleStatus, VehicleType,
        Waypoint,
    },
};
use crate::state::AppState;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateVehiclePayload {
    pub id: String,
    pub license_plate: String,
    pub vehicle_type: VehicleType,
    pub max_payload_kg: f64,
    pub fuel_battery_level_percent: u8,
    pub current_lat: f64,
    pub current_lng: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateDriverPayload {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub license_type: String,
}

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

    pub fn create_vehicle(
        state: &AppState,
        actor: &AuthUser,
        payload: CreateVehiclePayload,
    ) -> Result<Vehicle, String> {
        if !actor.has_permission(&Permission::FleetManage) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks FleetManage permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();
        if write
            .vehicles
            .iter()
            .any(|v| v.id == payload.id || v.license_plate == payload.license_plate)
        {
            return Err(format!(
                "Vehicle {} with plate {} already exists",
                payload.id, payload.license_plate
            ));
        }

        let vehicle = Vehicle {
            id: payload.id.clone(),
            license_plate: payload.license_plate.clone(),
            vehicle_type: payload.vehicle_type,
            max_payload_kg: payload.max_payload_kg,
            current_payload_kg: 0.0,
            status: VehicleStatus::Available,
            fuel_battery_level_percent: payload.fuel_battery_level_percent,
            odometer_km: 0.0,
            current_lat: payload.current_lat,
            current_lng: payload.current_lng,
        };

        write.vehicles.push(vehicle.clone());
        drop(write);

        state.record_audit(
            actor,
            "VEHICLE_REGISTERED",
            "Vehicle",
            &payload.id,
            None,
            Some(format!("Added {} ({})", payload.id, payload.license_plate)),
            "127.0.0.1",
        );

        Ok(vehicle)
    }

    pub fn create_driver(
        state: &AppState,
        actor: &AuthUser,
        payload: CreateDriverPayload,
    ) -> Result<Driver, String> {
        if !actor.has_permission(&Permission::FleetManage) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks FleetManage permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();
        if write.drivers.iter().any(|d| d.id == payload.id) {
            return Err(format!("Driver {} already exists", payload.id));
        }

        let driver = Driver {
            id: payload.id.clone(),
            name: payload.name.clone(),
            phone: payload.phone,
            license_type: payload.license_type,
            status: DriverStatus::Ready,
            rating: 5.0,
            assigned_vehicle_id: None,
            consecutive_driving_hours: 0.0,
            fatigue_warning: false,
        };

        write.drivers.push(driver.clone());
        drop(write);

        state.record_audit(
            actor,
            "DRIVER_ENROLLED",
            "Driver",
            &payload.id,
            None,
            Some(format!("Enrolled driver {} ({})", payload.name, payload.id)),
            "127.0.0.1",
        );

        Ok(driver)
    }

    pub fn dispatch_route(
        state: &AppState,
        actor: &AuthUser,
        payload: DispatchRoutePayload,
    ) -> Result<DeliveryRoute, String> {
        if !actor.has_permission(&Permission::RouteDispatch) {
            return Err(format!(
                "RBAC Error: Role {:?} lacks RouteDispatch permission",
                actor.role
            ));
        }

        let mut write = state.inner.write();

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

        let mut waypoints = Vec::new();
        let now = Utc::now();

        for (idx, order_id) in payload.order_ids.iter().enumerate() {
            if let Some(order) = write.orders.iter_mut().find(|o| o.id == *order_id) {
                order.status = OrderStatus::Dispatched;
                waypoints.push(Waypoint {
                    sequence: (idx + 1) as u32,
                    order_id: Some(*order_id),
                    address_label: format!(
                        "{}, {}",
                        order.delivery_address.street, order.delivery_address.city
                    ),
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
            route_code: format!("RTE-{}", route_id.to_string()[..6].to_uppercase()),
            driver_id: payload.driver_id.clone(),
            vehicle_id: payload.vehicle_id.clone(),
            origin_warehouse_id: payload.origin_warehouse_id,
            waypoints,
            total_distance_km: 34.8,
            status: "ACTIVE".to_string(),
            departure_time: Some(now),
            completion_time: None,
        };

        write.routes.push(route.clone());
        drop(write);

        state.record_audit(
            actor,
            "ROUTE_DISPATCHED",
            "DeliveryRoute",
            &route.route_code,
            None,
            Some(format!(
                "Dispatched {} with {} and {} waypoints",
                route.route_code,
                payload.vehicle_id,
                payload.order_ids.len()
            )),
            "127.0.0.1",
        );

        Ok(route)
    }

    pub fn submit_pod(
        state: &AppState,
        actor: &AuthUser,
        payload: SubmitPoDPayload,
    ) -> Result<ProofOfDelivery, String> {
        let mut write = state.inner.write();

        let order = write
            .orders
            .iter_mut()
            .find(|o| o.id == payload.order_id)
            .ok_or_else(|| format!("Order {} not found", payload.order_id))?;

        order.status = OrderStatus::Delivered;
        order.updated_at = Utc::now();
        let trk = order.tracking_number.clone();

        let pod = ProofOfDelivery {
            pod_id: Uuid::new_v4(),
            order_id: payload.order_id,
            tracking_number: trk.clone(),
            recipient_name: payload.recipient_name.clone(),
            relationship: payload.relationship.clone(),
            signature_hash: payload.signature_hash,
            photo_url: payload.photo_url,
            latitude: payload.latitude,
            longitude: payload.longitude,
            delivered_at: Utc::now(),
        };

        write.pods.push(pod.clone());
        drop(write);

        state.record_audit(
            actor,
            "POD_VERIFIED",
            "ProofOfDelivery",
            &trk,
            Some("InTransit".to_string()),
            Some(format!(
                "Delivered to {} ({})",
                payload.recipient_name, payload.relationship
            )),
            "127.0.0.1",
        );

        Ok(pod)
    }
}
