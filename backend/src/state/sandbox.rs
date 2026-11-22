use crate::domain::{
    finance::{Invoice, InvoiceStatus},
    order::{Address, OrderItem, OrderStatus, SalesOrder, ServiceTier},
    tracking::TrackingTimelineEvent,
    transportation::{Driver, DriverStatus, Vehicle, VehicleStatus, VehicleType},
    warehouse::{StockOpnameAudit, StorageZone, Warehouse, WarehouseStock},
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Isolated Developer Sandbox Simulation State
///
/// This state operates 100% in-memory and NEVER issues writes to PostgreSQL.
/// Used specifically for external developer testing, sandbox simulation,
/// CI smoke runs, and Postman API contract testing.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SandboxState {
    pub orders: Vec<SalesOrder>,
    pub warehouses: Vec<Warehouse>,
    pub stocks: Vec<WarehouseStock>,
    pub vehicles: Vec<Vehicle>,
    pub drivers: Vec<Driver>,
    pub invoices: Vec<Invoice>,
    pub tracking_events: Vec<TrackingTimelineEvent>,
    pub opnames: Vec<StockOpnameAudit>,
}

impl Default for SandboxState {
    fn default() -> Self {
        Self::new()
    }
}

impl SandboxState {
    pub fn new() -> Self {
        let now = Utc::now();

        // 1. Sandbox Warehouses
        let warehouses = vec![
            Warehouse {
                id: "WH-SBX-CGK-01".to_string(),
                name: "[Sandbox] Jakarta Soekarno-Hatta Megahub".to_string(),
                city: "Jakarta".to_string(),
                province: "DKI Jakarta".to_string(),
                total_bins: 5000,
                occupied_bins: 1250,
                active_personnel: 20,
                supports_cold_chain: true,
                latitude: -6.1255,
                longitude: 106.6558,
            },
            Warehouse {
                id: "WH-SBX-SUB-01".to_string(),
                name: "[Sandbox] Surabaya Tanjung Perak Hub".to_string(),
                city: "Surabaya".to_string(),
                province: "Jawa Timur".to_string(),
                total_bins: 3500,
                occupied_bins: 890,
                active_personnel: 15,
                supports_cold_chain: true,
                latitude: -7.2054,
                longitude: 112.7350,
            },
        ];

        // 2. Sandbox Stocks
        let stocks = vec![
            WarehouseStock {
                sku: "SBX-BIO-VAC-001".to_string(),
                warehouse_id: "WH-SBX-CGK-01".to_string(),
                name: "[Sandbox] mRNA Bio-Vaccine Ultra Cold Vials".to_string(),
                bin_code: "BIN-COLD-A01".to_string(),
                on_hand: 5000,
                reserved: 500,
                zone: StorageZone::ColdStorage,
                unit_weight_kg: 0.25,
            },
            WarehouseStock {
                sku: "SBX-SEMI-MCU-042".to_string(),
                warehouse_id: "WH-SBX-CGK-01".to_string(),
                name: "[Sandbox] Automotive ARM Microcontroller 7nm".to_string(),
                bin_code: "BIN-HIGH-C12".to_string(),
                on_hand: 20000,
                reserved: 1000,
                zone: StorageZone::HighValueSecure,
                unit_weight_kg: 0.05,
            },
            WarehouseStock {
                sku: "SBX-SOL-INV-10K".to_string(),
                warehouse_id: "WH-SBX-SUB-01".to_string(),
                name: "[Sandbox] Industrial Solar Inverter 10kW Three-Phase".to_string(),
                bin_code: "BIN-AMB-B05".to_string(),
                on_hand: 150,
                reserved: 10,
                zone: StorageZone::Ambient,
                unit_weight_kg: 45.0,
            },
        ];

        // 3. Sandbox Orders
        let orders = vec![
            SalesOrder {
                id: Uuid::parse_str("99990000-0000-0000-0000-000000000001").unwrap(),
                order_number: "ORD-SBX-2026-0001".to_string(),
                customer_id: "CUST-SBX-BIO".to_string(),
                customer_name: "BioPharma Sandbox Testing Lab".to_string(),
                status: OrderStatus::InTransit,
                service_tier: ServiceTier::ColdChainPriority,
                origin_warehouse_id: "WH-SBX-CGK-01".to_string(),
                delivery_address: Address {
                    street: "Jl. Pasteur No. 28".to_string(),
                    city: "Bandung".to_string(),
                    province: "Jawa Barat".to_string(),
                    postal_code: "40161".to_string(),
                    latitude: -6.9034,
                    longitude: 107.6186,
                    recipient_name: "Dr. Developer Sandbox".to_string(),
                    phone: "+62 811-0000-1111".to_string(),
                },
                items: vec![OrderItem {
                    item_id: Uuid::new_v4(),
                    sku: "SBX-BIO-VAC-001".to_string(),
                    name: "[Sandbox] mRNA Bio-Vaccine Ultra Cold Vials".to_string(),
                    quantity: 500,
                    unit_price: 250000.0,
                    weight_kg: 0.25,
                    volume_cbm: 0.001,
                }],
                tracking_number: "SBX-TRK-CGK-BDG-001".to_string(),
                total_amount: 125000000.0,
                total_weight_kg: 125.0,
                created_at: now - Duration::hours(4),
                updated_at: now - Duration::hours(1),
                created_by: Some(Uuid::parse_str("00000000-0000-4000-8000-000000000002").unwrap()),
                approved_by: Some(Uuid::parse_str("00000000-0000-4000-8000-000000000006").unwrap()),
                notes: Some("Sandbox simulated cold-chain dispatch".to_string()),
            },
            SalesOrder {
                id: Uuid::parse_str("99990000-0000-0000-0000-000000000002").unwrap(),
                order_number: "ORD-SBX-2026-0002".to_string(),
                customer_id: "CUST-SBX-AUTO".to_string(),
                customer_name: "Astra Mobility Sandbox QA".to_string(),
                status: OrderStatus::Draft,
                service_tier: ServiceTier::Express,
                origin_warehouse_id: "WH-SBX-CGK-01".to_string(),
                delivery_address: Address {
                    street: "Kawasan Industri MM2100".to_string(),
                    city: "Cikarang".to_string(),
                    province: "Jawa Barat".to_string(),
                    postal_code: "17520".to_string(),
                    latitude: -6.3122,
                    longitude: 107.0988,
                    recipient_name: "QA Lead Engineer".to_string(),
                    phone: "+62 812-2222-3333".to_string(),
                },
                items: vec![OrderItem {
                    item_id: Uuid::new_v4(),
                    sku: "SBX-SEMI-MCU-042".to_string(),
                    name: "[Sandbox] Automotive ARM Microcontroller 7nm".to_string(),
                    quantity: 1000,
                    unit_price: 185000.0,
                    weight_kg: 0.05,
                    volume_cbm: 0.0005,
                }],
                tracking_number: "SBX-TRK-CKR-AUTO-002".to_string(),
                total_amount: 185000000.0,
                total_weight_kg: 50.0,
                created_at: now - Duration::hours(1),
                updated_at: now,
                created_by: Some(Uuid::parse_str("00000000-0000-4000-8000-000000000002").unwrap()),
                approved_by: None,
                notes: Some("Pending SoD ProjectManager approval".to_string()),
            },
        ];

        // 4. Sandbox Vehicles & Drivers
        let vehicles = vec![
            Vehicle {
                id: "veh-sbx-001".to_string(),
                license_plate: "B 9000 SBX".to_string(),
                vehicle_type: VehicleType::ReeferColdTruck,
                max_payload_kg: 15000.0,
                current_payload_kg: 125.0,
                status: VehicleStatus::Dispatched,
                fuel_battery_level_percent: 85,
                odometer_km: 14200.0,
                current_lat: -6.4025,
                current_lng: 107.1234,
            },
            Vehicle {
                id: "veh-sbx-002".to_string(),
                license_plate: "B 9001 SBX".to_string(),
                vehicle_type: VehicleType::ElectricVan,
                max_payload_kg: 3500.0,
                current_payload_kg: 0.0,
                status: VehicleStatus::Available,
                fuel_battery_level_percent: 98,
                odometer_km: 5120.0,
                current_lat: -6.1255,
                current_lng: 106.6558,
            },
        ];

        let drivers = vec![Driver {
            id: "drv-sbx-001".to_string(),
            name: "Bambang Sandbox".to_string(),
            phone: "+62 811-9999-0001".to_string(),
            license_type: "B2 Umum".to_string(),
            status: DriverStatus::OnRoute,
            rating: 4.95,
            assigned_vehicle_id: Some("veh-sbx-001".to_string()),
            consecutive_driving_hours: 2.5,
            fatigue_warning: false,
        }];

        // 5. Sandbox Invoices
        let invoices = vec![Invoice {
            invoice_id: Uuid::parse_str("99991111-0000-0000-0000-000000000001").unwrap(),
            invoice_number: "INV-SBX-2026-0001".to_string(),
            order_id: Uuid::parse_str("99990000-0000-0000-0000-000000000001").unwrap(),
            customer_id: "CUST-SBX-BIO".to_string(),
            customer_name: "BioPharma Sandbox Testing Lab".to_string(),
            subtotal: 125000000.0,
            tax_amount: 13750000.0,
            total_amount: 138750000.0,
            status: InvoiceStatus::Issued,
            created_at: now - Duration::hours(3),
            due_date: now + Duration::days(14),
            created_by: Some(Uuid::parse_str("00000000-0000-4000-8000-000000000005").unwrap()),
            settled_by: None,
        }];

        // 6. Sandbox Tracking Events
        let tracking_events = vec![
            TrackingTimelineEvent {
                event_id: Uuid::new_v4(),
                tracking_number: "SBX-TRK-CGK-BDG-001".to_string(),
                status: "Order Confirmed".to_string(),
                location_name: "Jakarta Hub (WH-SBX-CGK-01)".to_string(),
                description: "Sales order initialized and stock reserved in Cold Storage"
                    .to_string(),
                timestamp: now - Duration::hours(4),
            },
            TrackingTimelineEvent {
                event_id: Uuid::new_v4(),
                tracking_number: "SBX-TRK-CGK-BDG-001".to_string(),
                status: "Cold-Chain Quality Inspected".to_string(),
                location_name: "Cryo Vault A01, Jakarta".to_string(),
                description: "Cargo temperature verified at -72.4°C before packaging".to_string(),
                timestamp: now - Duration::hours(3),
            },
            TrackingTimelineEvent {
                event_id: Uuid::new_v4(),
                tracking_number: "SBX-TRK-CGK-BDG-001".to_string(),
                status: "Dispatched & Telematics Active".to_string(),
                location_name: "Toll Cikampek KM 34".to_string(),
                description: "Vehicle B 9000 SBX en route with active GPS & IoT probe stream"
                    .to_string(),
                timestamp: now - Duration::hours(2),
            },
        ];

        Self {
            orders,
            warehouses,
            stocks,
            vehicles,
            drivers,
            invoices,
            tracking_events,
            opnames: Vec::new(),
        }
    }
}
