-- ==============================================================================
-- ELGS (Ethereal Logistics Management System) — Database Schema
-- Supabase PostgreSQL 15+ Migration Script
-- Complies with SOC-2 Audit Logging, RBAC & Segregation of Duties (SoD)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. RBAC & IAM
CREATE TABLE IF NOT EXISTS elgs_roles (
    role_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elgs_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id VARCHAR(50) REFERENCES elgs_roles(role_id),
    department VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elgs_role_permissions (
    role_id VARCHAR(50) REFERENCES elgs_roles(role_id),
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission)
);

-- 2. SOC-2 Compliance Audit Trail (Immutable Log)
CREATE TABLE IF NOT EXISTS elgs_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES elgs_users(user_id),
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. ORDER_CREATED, SOD_BLOCKED, OPNAME_APPROVED
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    hash_signature VARCHAR(128) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant audit querying by resource or actor
CREATE INDEX IF NOT EXISTS idx_audit_resource ON elgs_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON elgs_audit_logs(timestamp DESC);

-- 3. Multi-Warehouse & Facility Storage
CREATE TABLE IF NOT EXISTS elgs_warehouses (
    warehouse_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    total_bins INT NOT NULL DEFAULT 1000,
    occupied_bins INT NOT NULL DEFAULT 0,
    active_personnel INT NOT NULL DEFAULT 0,
    supports_cold_chain BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elgs_inventory (
    sku VARCHAR(100) NOT NULL,
    warehouse_id VARCHAR(50) REFERENCES elgs_warehouses(warehouse_id),
    name VARCHAR(255) NOT NULL,
    bin_code VARCHAR(50) NOT NULL,
    on_hand INT NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    zone VARCHAR(50) NOT NULL, -- Ambient, ColdStorage, HighValueSecure
    unit_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (sku, warehouse_id)
);

-- 4. Sales Orders & Line Items
CREATE TABLE IF NOT EXISTS elgs_sales_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    service_tier VARCHAR(50) NOT NULL,
    origin_warehouse_id VARCHAR(50) REFERENCES elgs_warehouses(warehouse_id),
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_street TEXT NOT NULL,
    recipient_city VARCHAR(100) NOT NULL,
    recipient_province VARCHAR(100) NOT NULL,
    recipient_postal VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_by UUID REFERENCES elgs_users(user_id),
    approved_by UUID REFERENCES elgs_users(user_id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elgs_order_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES elgs_sales_orders(order_id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(18, 2) NOT NULL,
    weight_kg DOUBLE PRECISION NOT NULL,
    volume_cbm DOUBLE PRECISION NOT NULL
);

-- 5. Stock Movements & SoD Audits
CREATE TABLE IF NOT EXISTS elgs_stock_opnames (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id VARCHAR(50) REFERENCES elgs_warehouses(warehouse_id),
    sku VARCHAR(100) NOT NULL,
    system_count INT NOT NULL,
    physical_count INT NOT NULL,
    discrepancy INT NOT NULL,
    counted_by UUID REFERENCES elgs_users(user_id),
    approved_by UUID REFERENCES elgs_users(user_id),
    status VARCHAR(50) DEFAULT 'PENDING_APPROVAL', -- PENDING_APPROVAL, RECONCILED, REJECTED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fleet & Telematics
CREATE TABLE IF NOT EXISTS elgs_vehicles (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    max_payload_kg DOUBLE PRECISION NOT NULL,
    current_payload_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    fuel_battery_percent INT NOT NULL DEFAULT 100,
    odometer_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elgs_drivers (
    driver_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    rating REAL NOT NULL DEFAULT 5.0,
    assigned_vehicle_id VARCHAR(50) REFERENCES elgs_vehicles(vehicle_id),
    consecutive_driving_hours REAL DEFAULT 0,
    fatigue_warning BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elgs_proof_of_delivery (
    pod_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES elgs_sales_orders(order_id),
    tracking_number VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    signature_hash VARCHAR(255) NOT NULL,
    photo_url TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    driver_id VARCHAR(50) REFERENCES elgs_drivers(driver_id),
    delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invoices & Billing
CREATE TABLE IF NOT EXISTS elgs_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES elgs_sales_orders(order_id),
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    subtotal NUMERIC(18, 2) NOT NULL,
    tax_amount NUMERIC(18, 2) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- Draft, Issued, Paid, Overdue, Cancelled
    created_by UUID REFERENCES elgs_users(user_id),
    settled_by UUID REFERENCES elgs_users(user_id),
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Initial Corporate Roles & Enterprise Seeds
-- ==============================================================================
INSERT INTO elgs_roles (role_id, name, description) VALUES
    ('SuperAdmin', 'Super Admin', 'Full enterprise-wide system governance and security administration'),
    ('ProjectManager', 'Project Manager', 'End-to-end supply chain logistics solutions and delivery management'),
    ('LogisticsManager', 'Logistics Manager', 'Order fulfillment, inventory allocation and hub management'),
    ('WarehouseOperator', 'Warehouse Operator', 'Cold storage vault operations and stock counts'),
    ('FleetDispatcher', 'Fleet Dispatcher', 'Carrier telematics, routing and driver dispatching'),
    ('FinanceAuditor', 'Finance Auditor', 'Ledger compliance, invoice reconciliation and tariff auditing'),
    ('Driver', 'Fleet Driver', 'Ground delivery execution and proof of delivery')
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO elgs_users (user_id, email, full_name, role_id, department) VALUES
    ('00000000-0000-4000-8000-000000000001', 'alexander.hartono@elgs.ethereal.co.id', 'Alexander Hartono', 'SuperAdmin', 'Enterprise Operations'),
    ('00000000-0000-4000-8000-000000000006', 'hendra.wijaya@elgs.ethereal.co.id', 'Hendra Wijaya', 'ProjectManager', 'Supply Chain Solutions & Project Management'),
    ('00000000-0000-4000-8000-000000000002', 'diana.puspita@elgs.ethereal.co.id', 'Diana Puspita', 'LogisticsManager', 'Fulfillment Management'),
    ('00000000-0000-4000-8000-000000000003', 'farhan.maulana@elgs.ethereal.co.id', 'Farhan Maulana', 'WarehouseOperator', 'Warehouse & Cryo Vault'),
    ('00000000-0000-4000-8000-000000000004', 'satria.wicaksono@elgs.ethereal.co.id', 'Satria Wicaksono', 'FleetDispatcher', 'Fleet Telematics'),
    ('00000000-0000-4000-8000-000000000005', 'evelyn.wijaya@elgs.ethereal.co.id', 'Evelyn Wijaya', 'FinanceAuditor', 'Treasury & Internal Audit'),
    ('00000000-0000-4000-8000-000000000007', 'bambang.driver@elgs.ethereal.co.id', 'Bambang Pamungkas', 'Driver', 'Ground Operations')
ON CONFLICT (email) DO NOTHING;
