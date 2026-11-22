use crate::domain::{
    audit::AuditRecord,
    finance::{Invoice, InvoiceStatus},
    order::{Address, OrderItem, OrderStatus, SalesOrder, ServiceTier},
    rbac::{AuthUser, UserRole},
    tracking::TrackingTimelineEvent,
    transportation::{
        DeliveryRoute, Driver, DriverStatus, ProofOfDelivery, Vehicle, VehicleStatus, VehicleType,
    },
    warehouse::{
        StockOpnameAudit, StockReservation, StockTransferRequest, StorageZone, Warehouse,
        WarehouseStock,
    },
};
use chrono::{Duration, Utc};
use parking_lot::RwLock;
use std::sync::Arc;
use uuid::Uuid;

pub struct AppStateInner {
    pub db: Option<sqlx::PgPool>,
    pub users: Vec<AuthUser>,
    pub current_user: AuthUser,
    pub audit_logs: Vec<AuditRecord>,
    pub orders: Vec<SalesOrder>,
    pub warehouses: Vec<Warehouse>,
    pub stocks: Vec<WarehouseStock>,
    pub reservations: Vec<StockReservation>,
    pub stock_transfers: Vec<StockTransferRequest>,
    pub stock_opnames: Vec<StockOpnameAudit>,
    pub vehicles: Vec<Vehicle>,
    pub drivers: Vec<Driver>,
    pub routes: Vec<DeliveryRoute>,
    pub pods: Vec<ProofOfDelivery>,
    pub tracking_events: Vec<TrackingTimelineEvent>,
    pub invoices: Vec<Invoice>,
}

#[derive(Clone)]
pub struct AppState {
    pub inner: Arc<RwLock<AppStateInner>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppState {
    pub fn new() -> Self {
        Self::with_db(None)
    }

    pub fn with_db(db: Option<sqlx::PgPool>) -> Self {
        let now = Utc::now();

        // 1. RBAC Users Roster
        let admin_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let manager_id = Uuid::parse_str("00000000-0000-4000-8000-000000000002").unwrap();
        let operator_id = Uuid::parse_str("00000000-0000-4000-8000-000000000003").unwrap();
        let dispatcher_id = Uuid::parse_str("00000000-0000-4000-8000-000000000004").unwrap();
        let auditor_id = Uuid::parse_str("00000000-0000-4000-8000-000000000005").unwrap();
        let pm_id = Uuid::parse_str("00000000-0000-4000-8000-000000000006").unwrap();
        let driver_id = Uuid::parse_str("00000000-0000-4000-8000-000000000007").unwrap();

        let users = vec![
            AuthUser {
                user_id: admin_id,
                full_name: "Alexander Hartono (Super Admin)".to_string(),
                email: "alexander.hartono@elgs.ethereal.co.id".to_string(),
                role: UserRole::SuperAdmin,
                department: "Enterprise Operations".to_string(),
            },
            AuthUser {
                user_id: pm_id,
                full_name: "Hendra Wijaya (Project Manager)".to_string(),
                email: "hendra.wijaya@elgs.ethereal.co.id".to_string(),
                role: UserRole::ProjectManager,
                department: "Supply Chain Solutions & Project Management".to_string(),
            },
            AuthUser {
                user_id: manager_id,
                full_name: "Diana Puspita (Logistics Manager)".to_string(),
                email: "diana.puspita@elgs.ethereal.co.id".to_string(),
                role: UserRole::LogisticsManager,
                department: "Fulfillment Management".to_string(),
            },
            AuthUser {
                user_id: operator_id,
                full_name: "Farhan Maulana (Warehouse Lead)".to_string(),
                email: "farhan.maulana@elgs.ethereal.co.id".to_string(),
                role: UserRole::WarehouseOperator,
                department: "Warehouse & Cryo Vault".to_string(),
            },
            AuthUser {
                user_id: dispatcher_id,
                full_name: "Satria Wicaksono (Fleet Dispatcher)".to_string(),
                email: "satria.wicaksono@elgs.ethereal.co.id".to_string(),
                role: UserRole::FleetDispatcher,
                department: "Fleet Telematics".to_string(),
            },
            AuthUser {
                user_id: auditor_id,
                full_name: "Evelyn Wijaya (Finance Auditor)".to_string(),
                email: "evelyn.wijaya@elgs.ethereal.co.id".to_string(),
                role: UserRole::FinanceAuditor,
                department: "Treasury & Internal Audit".to_string(),
            },
            AuthUser {
                user_id: driver_id,
                full_name: "Bambang Pamungkas (Fleet Driver)".to_string(),
                email: "bambang.driver@elgs.ethereal.co.id".to_string(),
                role: UserRole::Driver,
                department: "Ground Operations".to_string(),
            },
        ];

        let current_user = users[0].clone();

        // 2. Warehouses
        let warehouses = vec![
            Warehouse {
                id: "WH-JKT-CENTRAL".to_string(),
                name: "Jakarta Central Logistics Hub".to_string(),
                city: "Jakarta".to_string(),
                province: "DKI Jakarta".to_string(),
                total_bins: 5000,
                occupied_bins: 3850,
                active_personnel: 48,
                supports_cold_chain: true,
                latitude: -6.2088,
                longitude: 106.8456,
            },
            Warehouse {
                id: "WH-SBY-EAST".to_string(),
                name: "Surabaya Gateway Warehouse".to_string(),
                city: "Surabaya".to_string(),
                province: "Jawa Timur".to_string(),
                total_bins: 4200,
                occupied_bins: 2980,
                active_personnel: 36,
                supports_cold_chain: true,
                latitude: -7.2575,
                longitude: 112.7521,
            },
            Warehouse {
                id: "WH-BDG-WEST".to_string(),
                name: "Bandung Regional Crossdock".to_string(),
                city: "Bandung".to_string(),
                province: "Jawa Barat".to_string(),
                total_bins: 2800,
                occupied_bins: 1940,
                active_personnel: 24,
                supports_cold_chain: false,
                latitude: -6.9175,
                longitude: 107.6191,
            },
        ];

        // 3. Initial Stock
        let stocks = vec![
            WarehouseStock {
                sku: "MED-VAC-001".to_string(),
                name: "Bio-Pharmaceutical Vaccine Pack (-20C)".to_string(),
                warehouse_id: "WH-JKT-CENTRAL".to_string(),
                bin_code: "CC-RACK-01".to_string(),
                on_hand: 1200,
                reserved: 150,
                zone: StorageZone::ColdStorage,
                unit_weight_kg: 0.8,
            },
            WarehouseStock {
                sku: "ELEC-SRV-042".to_string(),
                name: "Enterprise Edge Gateway Server".to_string(),
                warehouse_id: "WH-JKT-CENTRAL".to_string(),
                bin_code: "SEC-AISLE-03".to_string(),
                on_hand: 450,
                reserved: 45,
                zone: StorageZone::HighValueSecure,
                unit_weight_kg: 6.5,
            },
            WarehouseStock {
                sku: "IND-SOL-109".to_string(),
                name: "Solar Inverter Controller 5kW".to_string(),
                warehouse_id: "WH-SBY-EAST".to_string(),
                bin_code: "AMB-ROW-12".to_string(),
                on_hand: 800,
                reserved: 80,
                zone: StorageZone::Ambient,
                unit_weight_kg: 12.0,
            },
            WarehouseStock {
                sku: "AUTO-ECU-88".to_string(),
                name: "Automotive Telematic ECU Unit".to_string(),
                warehouse_id: "WH-BDG-WEST".to_string(),
                bin_code: "AMB-ROW-04".to_string(),
                on_hand: 1500,
                reserved: 200,
                zone: StorageZone::Ambient,
                unit_weight_kg: 0.45,
            },
        ];

        // 4. Vehicles
        let vehicles = vec![
            Vehicle {
                id: "VH-REEFER-01".to_string(),
                license_plate: "B 9142 SXY".to_string(),
                vehicle_type: VehicleType::ReeferColdTruck,
                max_payload_kg: 3500.0,
                current_payload_kg: 2100.0,
                status: VehicleStatus::Dispatched,
                fuel_battery_level_percent: 84,
                odometer_km: 48200.0,
                current_lat: -6.2297,
                current_lng: 106.8295,
            },
            Vehicle {
                id: "VH-EVAN-02".to_string(),
                license_plate: "B 2049 EV".to_string(),
                vehicle_type: VehicleType::ElectricVan,
                max_payload_kg: 1200.0,
                current_payload_kg: 640.0,
                status: VehicleStatus::Dispatched,
                fuel_battery_level_percent: 92,
                odometer_km: 12450.0,
                current_lat: -6.1852,
                current_lng: 106.8312,
            },
            Vehicle {
                id: "VH-TRAILER-03".to_string(),
                license_plate: "L 8412 UZ".to_string(),
                vehicle_type: VehicleType::HeavyDutyTrailer,
                max_payload_kg: 24000.0,
                current_payload_kg: 0.0,
                status: VehicleStatus::Available,
                fuel_battery_level_percent: 98,
                odometer_km: 112000.0,
                current_lat: -7.2575,
                current_lng: 112.7521,
            },
        ];

        // 5. Drivers
        let drivers = vec![
            Driver {
                id: "DRV-101".to_string(),
                name: "Bambang Pamungkas".to_string(),
                phone: "+62 812-8899-1001".to_string(),
                license_type: "B2 Umum (Heavy)".to_string(),
                status: DriverStatus::OnRoute,
                rating: 4.92,
                assigned_vehicle_id: Some("VH-REEFER-01".to_string()),
                consecutive_driving_hours: 2.5,
                fatigue_warning: false,
            },
            Driver {
                id: "DRV-102".to_string(),
                name: "Agus Pratama".to_string(),
                phone: "+62 813-7722-4412".to_string(),
                license_type: "A (Commercial Light)".to_string(),
                status: DriverStatus::OnRoute,
                rating: 4.88,
                assigned_vehicle_id: Some("VH-EVAN-02".to_string()),
                consecutive_driving_hours: 1.8,
                fatigue_warning: false,
            },
        ];

        // 6. Orders
        let order_1_id = Uuid::new_v4();
        let order_1 = SalesOrder {
            id: order_1_id,
            order_number: "ORD-20261122-ALPHA01".to_string(),
            customer_id: "CUST-KIMIA-FARMA".to_string(),
            customer_name: "PT Kimia Farma Diagnostics".to_string(),
            items: vec![OrderItem {
                item_id: Uuid::new_v4(),
                sku: "MED-VAC-001".to_string(),
                name: "Bio-Pharmaceutical Vaccine Pack (-20C)".to_string(),
                quantity: 150,
                unit_price: 350_000.0,
                weight_kg: 0.8,
                volume_cbm: 0.002,
            }],
            status: OrderStatus::InTransit,
            service_tier: ServiceTier::ColdChainPriority,
            origin_warehouse_id: "WH-JKT-CENTRAL".to_string(),
            delivery_address: Address {
                recipient_name: "Dr. Hendra Gunawan".to_string(),
                phone: "+62 821-4455-6677".to_string(),
                street: "Jl. Diponegoro No. 71, Menteng".to_string(),
                city: "Jakarta".to_string(),
                province: "DKI Jakarta".to_string(),
                postal_code: "10310".to_string(),
                latitude: -6.1963,
                longitude: 106.8489,
            },
            tracking_number: "TRK-ALPHA01".to_string(),
            total_amount: 52_500_000.0,
            total_weight_kg: 120.0,
            created_by: Some(manager_id),
            approved_by: Some(admin_id),
            notes: Some("Temperature sensitive: Keep between -25C and -15C".to_string()),
            created_at: now - Duration::hours(3),
            updated_at: now - Duration::minutes(20),
        };

        let order_2_id = Uuid::new_v4();
        let order_2 = SalesOrder {
            id: order_2_id,
            order_number: "ORD-20261122-BETA02".to_string(),
            customer_id: "CUST-TELKOM".to_string(),
            customer_name: "Telkom Data Infrastructure".to_string(),
            items: vec![OrderItem {
                item_id: Uuid::new_v4(),
                sku: "ELEC-SRV-042".to_string(),
                name: "Enterprise Edge Gateway Server".to_string(),
                quantity: 20,
                unit_price: 18_500_000.0,
                weight_kg: 6.5,
                volume_cbm: 0.025,
            }],
            status: OrderStatus::Picking,
            service_tier: ServiceTier::Express,
            origin_warehouse_id: "WH-JKT-CENTRAL".to_string(),
            delivery_address: Address {
                recipient_name: "Budi Santoso, ST".to_string(),
                phone: "+62 815-9988-1234".to_string(),
                street: "Jl. Gatot Subroto Kav. 52".to_string(),
                city: "Jakarta".to_string(),
                province: "DKI Jakarta".to_string(),
                postal_code: "12710".to_string(),
                latitude: -6.2384,
                longitude: 106.8315,
            },
            tracking_number: "TRK-BETA02".to_string(),
            total_amount: 370_000_000.0,
            total_weight_kg: 130.0,
            created_by: Some(manager_id),
            approved_by: None,
            notes: Some("Handle with care: fragile server equipment".to_string()),
            created_at: now - Duration::hours(1),
            updated_at: now - Duration::minutes(15),
        };

        let order_3_id = Uuid::new_v4();
        let order_3 = SalesOrder {
            id: order_3_id,
            order_number: "ORD-20261122-GAMMA03".to_string(),
            customer_id: "CUST-PLN-NUSANTARA".to_string(),
            customer_name: "PLN Nusantara Power".to_string(),
            items: vec![OrderItem {
                item_id: Uuid::new_v4(),
                sku: "IND-SOL-109".to_string(),
                name: "Solar Inverter Controller 5kW".to_string(),
                quantity: 15,
                unit_price: 24_000_000.0,
                weight_kg: 12.0,
                volume_cbm: 0.05,
            }],
            status: OrderStatus::Delivered,
            service_tier: ServiceTier::Standard,
            origin_warehouse_id: "WH-SBY-EAST".to_string(),
            delivery_address: Address {
                recipient_name: "Ir. Joko Widodo M.T.".to_string(),
                phone: "+62 811-3322-1144".to_string(),
                street: "Kawasan Industri SIER Rungkut".to_string(),
                city: "Surabaya".to_string(),
                province: "Jawa Timur".to_string(),
                postal_code: "60293".to_string(),
                latitude: -7.3235,
                longitude: 112.7601,
            },
            tracking_number: "TRK-GAMMA03".to_string(),
            total_amount: 360_000_000.0,
            total_weight_kg: 180.0,
            created_by: Some(manager_id),
            approved_by: Some(admin_id),
            notes: None,
            created_at: now - Duration::hours(12),
            updated_at: now - Duration::minutes(40),
        };

        // 7. Initial SOC-2 Audit Trail
        let audit_logs = vec![
            AuditRecord::new(
                admin_id,
                "Alexander Hartono".to_string(),
                "SuperAdmin".to_string(),
                "SYSTEM_BOOTSTRAP".to_string(),
                "ELGS_CORE".to_string(),
                "INIT".to_string(),
                None,
                Some("Genesis state initialized with SOC-2 non-repudiation".to_string()),
                "127.0.0.1".to_string(),
            ),
            AuditRecord::new(
                manager_id,
                "Diana Puspita".to_string(),
                "LogisticsManager".to_string(),
                "ORDER_CREATED".to_string(),
                "SalesOrder".to_string(),
                order_1_id.to_string(),
                None,
                Some(format!("Created sales order {}", order_1.order_number)),
                "192.168.1.10".to_string(),
            ),
            AuditRecord::new(
                admin_id,
                "Alexander Hartono".to_string(),
                "SuperAdmin".to_string(),
                "ORDER_APPROVED".to_string(),
                "SalesOrder".to_string(),
                order_1_id.to_string(),
                Some("Draft".to_string()),
                Some("InventoryReserved - Maker-checker verified".to_string()),
                "192.168.1.1".to_string(),
            ),
        ];

        // 8. Invoices
        let invoices = vec![Invoice {
            invoice_id: Uuid::new_v4(),
            invoice_number: "INV-2026-00812".to_string(),
            order_id: order_1_id,
            customer_id: "CUST-KIMIA-FARMA".to_string(),
            customer_name: "PT Kimia Farma Diagnostics".to_string(),
            subtotal: 52_500_000.0,
            tax_amount: 5_775_000.0,
            total_amount: 58_275_000.0,
            status: InvoiceStatus::Issued,
            created_by: Some(auditor_id),
            settled_by: None,
            due_date: now + Duration::days(14),
            created_at: now - Duration::hours(2),
        }];

        Self {
            inner: Arc::new(RwLock::new(AppStateInner {
                db,
                users,
                current_user,
                audit_logs,
                orders: vec![order_1, order_2, order_3],
                warehouses,
                stocks,
                reservations: vec![],
                stock_transfers: vec![],
                stock_opnames: vec![],
                vehicles,
                drivers,
                routes: vec![],
                pods: vec![],
                tracking_events: vec![],
                invoices,
            })),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn record_audit(
        &self,
        actor: &AuthUser,
        action: &str,
        resource_type: &str,
        resource_id: &str,
        before: Option<String>,
        after: Option<String>,
        ip: &str,
    ) {
        let record = AuditRecord::new(
            actor.user_id,
            actor.full_name.clone(),
            actor.role.as_str().to_string(),
            action.to_string(),
            resource_type.to_string(),
            resource_id.to_string(),
            before,
            after,
            ip.to_string(),
        );
        let mut write = self.inner.write();
        write.audit_logs.push(record);
    }
}
