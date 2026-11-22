-- Seed initial enterprise operational data for ELGS

-- 1. Warehouses
INSERT INTO elgs_warehouses (warehouse_id, name, city, province, total_bins, occupied_bins, active_personnel, supports_cold_chain, latitude, longitude)
VALUES
    ('wh-cgk-01', 'Jakarta Soekarno-Hatta Megahub', 'Jakarta Barat', 'DKI Jakarta', 5000, 3240, 48, TRUE, -6.1255, 106.6558),
    ('wh-sub-01', 'Surabaya Tanjung Perak Hub', 'Surabaya', 'Jawa Timur', 3500, 1850, 32, TRUE, -7.2054, 112.7350),
    ('wh-kno-01', 'Medan Kualanamu Gateway', 'Deli Serdang', 'Sumatera Utara', 2500, 1120, 24, FALSE, 3.6422, 98.8852),
    ('wh-upg-01', 'Makassar Sultan Hasanuddin Distribution', 'Makassar', 'Sulawesi Selatan', 2000, 940, 18, FALSE, -5.0617, 119.5540)
ON CONFLICT (warehouse_id) DO NOTHING;

-- 2. Inventory Items
INSERT INTO elgs_inventory (sku, warehouse_id, name, bin_code, on_hand, reserved, zone, unit_weight_kg)
VALUES
    ('SKU-BIO-VAC-001', 'wh-cgk-01', 'mRNA Bio-Vaccine Ultra Cold Vials', 'BIN-COLD-A01', 12500, 1500, 'ColdStorage', 0.25),
    ('SKU-SEMI-MCU-042', 'wh-cgk-01', 'Automotive ARM Microcontroller 7nm', 'BIN-HIGH-C12', 84000, 5000, 'HighValueSecure', 0.05),
    ('SKU-SOL-INV-10K', 'wh-sub-01', 'Industrial Solar Inverter 10kW Three-Phase', 'BIN-AMB-B05', 320, 25, 'Ambient', 45.0),
    ('SKU-MED-DIAG-008', 'wh-sub-01', 'Rapid Automated Molecular Assay Kits', 'BIN-COLD-B02', 4800, 600, 'ColdStorage', 1.2),
    ('SKU-AERO-TURB-09', 'wh-kno-01', 'Titanium High-Pressure Turbine Blades', 'BIN-HIGH-A04', 150, 12, 'HighValueSecure', 18.5),
    ('SKU-EV-BAT-CELL', 'wh-upg-01', 'Prismatic Lithium Iron Phosphate Cell 3.2V', 'BIN-AMB-D08', 18500, 2000, 'Ambient', 2.1)
ON CONFLICT (sku, warehouse_id) DO NOTHING;

-- 3. Vehicles
INSERT INTO elgs_vehicles (vehicle_id, license_plate, vehicle_type, max_payload_kg, current_payload_kg, status, fuel_battery_percent, odometer_km, current_lat, current_lng)
VALUES
    ('veh-b-9801-xyz', 'B 9801 XYZ', 'Refrigerated Heavy Truck (32T)', 32000.0, 1420.0, 'InTransit', 88, 48250.0, -6.2088, 106.8456),
    ('veh-b-9234-kpm', 'B 9234 KPM', 'Electric High-Cube Van (5T)', 5000.0, 0.0, 'Available', 100, 12400.0, -6.1255, 106.6558),
    ('veh-l-8812-pq',  'L 8812 PQ',  'Temperature-Controlled Container Truck', 24000.0, 8900.0, 'InTransit', 74, 92100.0, -7.2575, 112.7521),
    ('veh-bk-7721-ab', 'BK 7721 AB', 'Intercity Cargo Hauler (15T)', 15000.0, 0.0, 'UnderMaintenance', 45, 154000.0, 3.5952, 98.6722)
ON CONFLICT (vehicle_id) DO NOTHING;

-- 4. Drivers
INSERT INTO elgs_drivers (driver_id, name, phone, license_type, status, rating, assigned_vehicle_id, consecutive_driving_hours, fatigue_warning)
VALUES
    ('drv-001', 'Bambang Pamungkas', '+62 811-9876-5432', 'B2 Umum', 'Driving', 4.95, 'veh-b-9801-xyz', 3.2, FALSE),
    ('drv-002', 'Agus Prasetyo', '+62 812-3344-5566', 'B1 Umum', 'Available', 4.88, 'veh-b-9234-kpm', 0.0, FALSE),
    ('drv-003', 'Rudi Hermawan', '+62 813-7788-9900', 'B2 Umum', 'Driving', 4.92, 'veh-l-8812-pq', 2.8, FALSE),
    ('drv-004', 'Dedi Kurniawan', '+62 815-4455-6677', 'B2 Umum', 'OffDuty', 4.80, NULL, 0.0, FALSE)
ON CONFLICT (driver_id) DO NOTHING;

-- 5. Sales Orders
INSERT INTO elgs_sales_orders (
    order_id, order_number, customer_id, customer_name, status, service_tier,
    origin_warehouse_id, recipient_name, recipient_phone, recipient_street,
    recipient_city, recipient_province, recipient_postal, latitude, longitude,
    tracking_number, total_amount, total_weight_kg, created_by, approved_by
)
VALUES
    (
        '10000000-0000-0000-0000-000000000001', 'ORD-2026-0891', 'CUST-BIO-ID', 'PT Bio Farma Persero',
        'InTransit', 'ColdChainExpress', 'wh-cgk-01', 'Dr. Setiawan', '+62 812-1111-2222',
        'Jl. Pasteur No. 28', 'Bandung', 'Jawa Barat', '40161', -6.9034, 107.6186,
        'TRK-CGK-BDG-88192', 205350000.00, 1420.0,
        '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000006'
    ),
    (
        '10000000-0000-0000-0000-000000000002', 'ORD-2026-0892', 'CUST-ASTRA-ID', 'PT Astra Otoparts Tbk',
        'Delivered', 'NextDay', 'wh-cgk-01', 'Budi Santoso', '+62 813-2222-3333',
        'Kawasan Industri GIIC Cikarang Pusat', 'Bekasi', 'Jawa Barat', '17530', -6.3644, 107.1725,
        'TRK-CKR-AST-90214', 388500000.00, 4500.0,
        '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000006'
    ),
    (
        '10000000-0000-0000-0000-000000000003', 'ORD-2026-0893', 'CUST-PLN-ID', 'PT PLN Nusantara Power',
        'Approved', 'StandardFreight', 'wh-sub-01', 'Ir. Wahyudi', '+62 814-3333-4444',
        'Jl. Harun Tohir No. 1', 'Gresik', 'Jawa Timur', '61112', -7.1566, 112.6555,
        'TRK-SUB-GSK-33410', 464000000.00, 8900.0,
        '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000006'
    ),
    (
        '10000000-0000-0000-0000-000000000004', 'ORD-2026-0894', 'CUST-SILOAM-ID', 'Siloam International Hospitals',
        'Draft', 'ColdChainExpress', 'wh-kno-01', 'dr. Mariana', '+62 815-4444-5555',
        'Jl. Imam Bonjol No. 6', 'Medan', 'Sumatera Utara', '20112', 3.5852, 98.6756,
        'TRK-KNO-SLM-11209', 147000000.00, 350.0,
        '00000000-0000-4000-8000-000000000002', NULL
    )
ON CONFLICT (order_id) DO NOTHING;

-- 6. Invoices
INSERT INTO elgs_invoices (invoice_id, invoice_number, order_id, customer_id, customer_name, subtotal, tax_amount, total_amount, status, created_by, settled_by, due_date)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'INV-2026-0041', '10000000-0000-0000-0000-000000000002', 'CUST-ASTRA-ID', 'PT Astra Otoparts Tbk', 350000000.00, 38500000.00, 388500000.00, 'Paid', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000005', NOW() + INTERVAL '30 days'),
    ('20000000-0000-0000-0000-000000000002', 'INV-2026-0042', '10000000-0000-0000-0000-000000000001', 'CUST-BIO-ID', 'PT Bio Farma Persero', 185000000.00, 20350000.00, 205350000.00, 'Issued', '00000000-0000-4000-8000-000000000005', NULL, NOW() + INTERVAL '14 days')
ON CONFLICT (invoice_id) DO NOTHING;

-- 7. Audit Logs
INSERT INTO elgs_audit_logs (audit_id, actor_id, actor_name, actor_role, action, resource_type, resource_id, before_state, after_state, ip_address, hash_signature)
VALUES
    (gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Alexander Hartono', 'SuperAdmin', 'SCHEMA_INITIALIZE', 'SYSTEM', 'SUPABASE_PROD', '{"status": "Pending"}'::jsonb, '{"status": "Active", "environment": "Production"}'::jsonb, '127.0.0.1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
    (gen_random_uuid(), '00000000-0000-4000-8000-000000000006', 'Hendra Wijaya', 'ProjectManager', 'APPROVE_ORDER', 'ORDER', '10000000-0000-0000-0000-000000000001', '{"status": "Draft"}'::jsonb, '{"status": "Approved"}'::jsonb, '127.0.0.1', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'),
    (gen_random_uuid(), '00000000-0000-4000-8000-000000000004', 'Satria Wicaksono', 'FleetDispatcher', 'DISPATCH_CARRIER', 'DISPATCH', 'veh-b-9801-xyz', '{"status": "Available"}'::jsonb, '{"status": "InTransit", "driver": "Bambang Pamungkas"}'::jsonb, '127.0.0.1', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae')
ON CONFLICT (audit_id) DO NOTHING;
