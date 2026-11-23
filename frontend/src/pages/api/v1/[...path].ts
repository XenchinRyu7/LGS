import type { APIRoute } from 'astro';
import { Pool } from 'pg';
import crypto from 'crypto';

export const prerender = false;

// PostgreSQL pool initialized from DATABASE_URL
let pool: Pool | null = null;
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  } catch (err) {
    console.warn('PostgreSQL pool init failed, using enterprise memory store:', err);
    pool = null;
  }
}

// Enterprise Personas & Seeds
const INITIAL_USERS = [
  {
    user_id: '00000000-0000-4000-8000-000000000001',
    email: 'alexander.hartono@elgs.ethereal.co.id',
    full_name: 'Alexander Hartono',
    role: 'SuperAdmin',
    department: 'Enterprise Operations',
  },
  {
    user_id: '00000000-0000-4000-8000-000000000006',
    email: 'hendra.wijaya@elgs.ethereal.co.id',
    full_name: 'Hendra Wijaya',
    role: 'ProjectManager',
    department: 'Supply Chain Solutions & Project Management',
  },
  {
    user_id: '00000000-0000-4000-8000-000000000002',
    email: 'diana.puspita@elgs.ethereal.co.id',
    full_name: 'Diana Puspita',
    role: 'LogisticsManager',
    department: 'Fulfillment Management',
  },
  {
    user_id: '00000000-0000-4000-8000-000000000003',
    email: 'farhan.maulana@elgs.ethereal.co.id',
    full_name: 'Farhan Maulana',
    role: 'WarehouseOperator',
    department: 'Warehouse & Cryo Vault',
  },
  {
    user_id: '00000000-0000-4000-8000-000000000004',
    email: 'satria.wicaksono@elgs.ethereal.co.id',
    full_name: 'Satria Wicaksono',
    role: 'FleetDispatcher',
    department: 'Fleet Telematics',
  },
  {
    user_id: '00000000-0000-4000-8000-000000000005',
    email: 'evelyn.wijaya@elgs.ethereal.co.id',
    full_name: 'Evelyn Wijaya',
    role: 'FinanceAuditor',
    department: 'Treasury & Internal Audit',
  },
  {
    user_id: '00000000-0000-4000-8000-000000000007',
    email: 'bambang.driver@elgs.ethereal.co.id',
    full_name: 'Bambang Pamungkas',
    role: 'Driver',
    department: 'Ground Operations',
  },
];

let currentUser = { ...INITIAL_USERS[0] };

const INITIAL_WAREHOUSES = [
  {
    id: 'WH-JKT-CENTRAL',
    name: 'Jakarta Central Logistics Hub',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    total_bins: 5000,
    occupied_bins: 3850,
    active_personnel: 48,
    supports_cold_chain: true,
    latitude: -6.2088,
    longitude: 106.8456,
  },
  {
    id: 'WH-SBY-EAST',
    name: 'Surabaya Gateway Warehouse',
    city: 'Surabaya',
    province: 'Jawa Timur',
    total_bins: 4200,
    occupied_bins: 2980,
    active_personnel: 36,
    supports_cold_chain: true,
    latitude: -7.2575,
    longitude: 112.7521,
  },
  {
    id: 'WH-BDG-WEST',
    name: 'Bandung Regional Crossdock',
    city: 'Bandung',
    province: 'Jawa Barat',
    total_bins: 2800,
    occupied_bins: 1940,
    active_personnel: 24,
    supports_cold_chain: false,
    latitude: -6.9175,
    longitude: 107.6191,
  },
];

const INITIAL_INVENTORY = [
  {
    sku: 'MED-VAC-001',
    name: 'Bio-Pharmaceutical Vaccine Pack (-20C)',
    warehouse_id: 'WH-JKT-CENTRAL',
    bin_code: 'CC-RACK-01',
    on_hand: 1200,
    reserved: 150,
    zone: 'ColdStorage',
    unit_weight_kg: 0.8,
  },
  {
    sku: 'ELEC-SRV-042',
    name: 'Enterprise Edge Gateway Server',
    warehouse_id: 'WH-JKT-CENTRAL',
    bin_code: 'SEC-AISLE-03',
    on_hand: 450,
    reserved: 45,
    zone: 'HighValueSecure',
    unit_weight_kg: 6.5,
  },
  {
    sku: 'IND-SOL-109',
    name: 'Solar Inverter Controller 5kW',
    warehouse_id: 'WH-SBY-EAST',
    bin_code: 'AMB-ROW-12',
    on_hand: 800,
    reserved: 80,
    zone: 'Ambient',
    unit_weight_kg: 12.0,
  },
  {
    sku: 'AUTO-ECU-882',
    name: 'Automotive Engine Control Unit Dual-CAN',
    warehouse_id: 'WH-BDG-WEST',
    bin_code: 'AMB-SEC-01',
    on_hand: 620,
    reserved: 30,
    zone: 'Ambient',
    unit_weight_kg: 2.1,
  },
];

let ordersStore: Array<{
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  items: any[];
  status: string;
  service_tier: string;
  origin_warehouse_id: string;
  delivery_address: any;
  tracking_number: string;
  total_amount: number;
  total_weight_kg: number;
  created_by: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}> = [
  {
    order_id: '8a1f2e34-5b6c-4d7e-8f9a-0b1c2d3e4f5a',
    order_number: 'ORD-2026-00491',
    customer_id: 'CUST-KIMIA-FARMA',
    customer_name: 'PT Kimia Farma Diagnostics',
    items: [
      {
        item_id: '11111111-2222-3333-4444-555555555555',
        sku: 'MED-VAC-001',
        name: 'Bio-Pharmaceutical Vaccine Pack (-20C)',
        quantity: 50,
        unit_price: 1050000.0,
        weight_kg: 0.8,
        volume_cbm: 0.002,
      },
    ],
    status: 'InTransit',
    service_tier: 'ColdChainExpress',
    origin_warehouse_id: 'WH-JKT-CENTRAL',
    delivery_address: {
      recipient_name: 'Dr. Siti Nurhaliza Sp.A',
      phone: '+62 812-9876-5432',
      street: 'Jl. Salemba Raya No. 41',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postal_code: '10430',
      latitude: -6.1954,
      longitude: 106.8523,
    },
    tracking_number: 'TRK-ALPHA01',
    total_amount: 52500000.0,
    total_weight_kg: 40.0,
    created_by: '00000000-0000-4000-8000-000000000002',
    approved_by: '00000000-0000-4000-8000-000000000001',
    notes: 'Urgent bio-cold shipment for Clinical Trial Stage 3',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    order_id: '9b2f3e45-6c7d-5e8f-9a0b-1c2d3e4f5a6b',
    order_number: 'ORD-2026-00492',
    customer_id: 'CUST-TELKOM-SIG',
    customer_name: 'PT Telkom Satelit Indonesia',
    items: [
      {
        item_id: '22222222-3333-4444-5555-666666666666',
        sku: 'ELEC-SRV-042',
        name: 'Enterprise Edge Gateway Server',
        quantity: 10,
        unit_price: 38500000.0,
        weight_kg: 6.5,
        volume_cbm: 0.035,
      },
    ],
    status: 'InventoryReserved',
    service_tier: 'PriorityExpress',
    origin_warehouse_id: 'WH-JKT-CENTRAL',
    delivery_address: {
      recipient_name: 'Budi Santoso S.T.',
      phone: '+62 813-1122-3344',
      street: 'Telkom Landmark Tower Lt. 28, Jl. Jend. Gatot Subroto',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12710',
      latitude: -6.2301,
      longitude: 106.8174,
    },
    tracking_number: 'TRK-BETA02',
    total_amount: 385000000.0,
    total_weight_kg: 65.0,
    created_by: '00000000-0000-4000-8000-000000000002',
    approved_by: '00000000-0000-4000-8000-000000000001',
    notes: 'Secure escort required for edge communication gateway',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    order_id: 'ac3f4e56-7d8e-6f9a-0b1c-2d3e4f5a6b7c',
    order_number: 'ORD-2026-00493',
    customer_id: 'CUST-BARATA-IND',
    customer_name: 'PT Barata Indonesia',
    items: [
      {
        item_id: '33333333-4444-5555-6666-777777777777',
        sku: 'IND-SOL-109',
        name: 'Solar Inverter Controller 5kW',
        quantity: 15,
        unit_price: 24000000.0,
        weight_kg: 12.0,
        volume_cbm: 0.05,
      },
    ],
    status: 'Delivered',
    service_tier: 'Standard',
    origin_warehouse_id: 'WH-SBY-EAST',
    delivery_address: {
      recipient_name: 'Ir. Joko Widodo M.T.',
      phone: '+62 811-3322-1144',
      street: 'Kawasan Industri SIER Rungkut',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postal_code: '60293',
      latitude: -7.3235,
      longitude: 112.7601,
    },
    tracking_number: 'TRK-GAMMA03',
    total_amount: 360000000.0,
    total_weight_kg: 180.0,
    created_by: '00000000-0000-4000-8000-000000000002',
    approved_by: '00000000-0000-4000-8000-000000000001',
    notes: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

let fleetStore = {
  vehicles: [
    {
      vehicle_id: 'VEH-EV-01',
      license_plate: 'B 9201 ELG',
      vehicle_type: 'ElectricRefrigeratedVan',
      max_payload_kg: 1200.0,
      current_payload_kg: 40.0,
      status: 'Active',
      fuel_battery_percent: 88,
      odometer_km: 14250.0,
      current_lat: -6.2088,
      current_lng: 106.8456,
    },
    {
      vehicle_id: 'VEH-TRK-02',
      license_plate: 'B 9844 UXZ',
      vehicle_type: 'HeavyDutyTruck',
      max_payload_kg: 15000.0,
      current_payload_kg: 8500.0,
      status: 'InTransit',
      fuel_battery_percent: 74,
      odometer_km: 84210.0,
      current_lat: -6.9175,
      current_lng: 107.6191,
    },
  ],
  drivers: [
    {
      driver_id: 'DRV-001',
      name: 'Bambang Pamungkas',
      phone: '+62 812-9988-7766',
      license_type: 'SIM B2 Umum',
      status: 'OnDuty',
      rating: 4.95,
      assigned_vehicle_id: 'VEH-EV-01',
      consecutive_driving_hours: 2.5,
      fatigue_warning: false,
    },
    {
      driver_id: 'DRV-002',
      name: 'Agus Setiawan',
      phone: '+62 813-4455-6677',
      license_type: 'SIM B1',
      status: 'Resting',
      rating: 4.88,
      assigned_vehicle_id: 'VEH-TRK-02',
      consecutive_driving_hours: 0.0,
      fatigue_warning: false,
    },
  ],
};

let invoicesStore = [
  {
    invoice_id: 'e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c',
    invoice_number: 'INV-2026-00812',
    order_id: '8a1f2e34-5b6c-4d7e-8f9a-0b1c2d3e4f5a',
    customer_id: 'CUST-KIMIA-FARMA',
    customer_name: 'PT Kimia Farma Diagnostics',
    subtotal: 52500000.0,
    tax_amount: 5775000.0,
    total_amount: 58275000.0,
    status: 'Issued',
    due_date: new Date(Date.now() + 86400000 * 14).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

let auditTrailStore = [
  {
    audit_id: 'f1e2d3c4-b5a6-4f7e-8d9c-0b1a2c3d4e5f',
    actor_id: '00000000-0000-4000-8000-000000000001',
    actor_name: 'Alexander Hartono',
    actor_role: 'SuperAdmin',
    action: 'SYSTEM_BOOTSTRAP',
    resource_type: 'ELGS_CORE',
    resource_id: 'INIT',
    before_state: null,
    after_state: 'Genesis state initialized with SOC-2 non-repudiation and Supabase PostgreSQL connection',
    ip_address: '127.0.0.1',
    hash_signature: crypto.createHash('sha256').update('BOOTSTRAP-INITIAL').digest('hex'),
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

export const ALL: APIRoute = async ({ request, params }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    });
  }

  const url = new URL(request.url);
  let subpath = params.path || '';
  if (!subpath.startsWith('/')) subpath = '/' + subpath;
  if (subpath.length > 1 && subpath.endsWith('/')) subpath = subpath.slice(0, -1);

  const method = request.method.toUpperCase();

  try {
    // 1. Health
    if (subpath === '/health' && method === 'GET') {
      return jsonResponse({
        status: 'ok',
        version: '1.0.0',
        environment: 'astro-ssr-vercel',
        database: pool ? 'connected (Supabase PostgreSQL)' : 'in-memory (enterprise seed)',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Auth Routes
    if (subpath === '/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const email = (body.email || '').toLowerCase().trim();

      if (pool) {
        try {
          const dbRes = await pool.query(
            'SELECT user_id, email, full_name, role_id as role, department FROM elgs_users WHERE email = $1 AND is_active = TRUE',
            [email]
          );
          if (dbRes.rows.length > 0) {
            const user = dbRes.rows[0];
            currentUser = { ...user };
            const token = `elgs_jwt_${Buffer.from(JSON.stringify(user)).toString('base64')}`;
            return jsonResponse({ token, user });
          }
        } catch (dbErr) {
          console.warn('DB lookup failed, checking in-memory personas:', dbErr);
        }
      }

      const matched = INITIAL_USERS.find(
        (u) => u.email.toLowerCase() === email || u.email.toLowerCase().includes(email.split('@')[0])
      );
      const user = matched || {
        user_id: crypto.randomUUID(),
        email: email || 'operator@elgs.ethereal.co.id',
        full_name: email.split('@')[0] || 'Enterprise Operator',
        role: 'WarehouseOperator',
        department: 'Operations & Cryo Vault',
      };
      currentUser = { ...user };
      const token = `elgs_jwt_${Buffer.from(JSON.stringify(user)).toString('base64')}`;
      return jsonResponse({ token, user });
    }

    if (subpath === '/auth/register' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newUser = {
        user_id: crypto.randomUUID(),
        email: body.email || 'user@elgs.ethereal.co.id',
        full_name: body.full_name || 'New User',
        role: body.role || 'WarehouseOperator',
        department: body.department || 'Operations',
      };
      currentUser = { ...newUser };
      return jsonResponse(
        {
          token: `elgs_jwt_${Buffer.from(JSON.stringify(newUser)).toString('base64')}`,
          user: newUser,
        },
        201
      );
    }

    if (subpath === '/auth/logout' && method === 'POST') {
      return jsonResponse({ success: true, message: 'Logged out successfully' });
    }

    if (subpath === '/auth/me' && method === 'GET') {
      return jsonResponse(currentUser);
    }

    if (subpath === '/auth/switch-role' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newRole = body.role || 'SuperAdmin';
      currentUser.role = newRole;
      return jsonResponse(currentUser);
    }

    // 3. Audit Trail
    if (subpath === '/audit-trail' && method === 'GET') {
      if (pool) {
        try {
          const dbRes = await pool.query(
            'SELECT audit_id, actor_id, actor_name, actor_role, action, resource_type, resource_id, before_state, after_state, ip_address, hash_signature, timestamp FROM elgs_audit_logs ORDER BY timestamp DESC LIMIT 50'
          );
          if (dbRes.rows.length > 0) return jsonResponse(dbRes.rows);
        } catch (dbErr) {
          console.warn('DB audit fetch failed:', dbErr);
        }
      }
      return jsonResponse(auditTrailStore);
    }

    // 4. Analytics Overview
    if (subpath === '/analytics/overview' && method === 'GET') {
      return jsonResponse({
        total_revenue_idr: 1250000000,
        active_shipments: 42,
        on_time_delivery_rate: 98.4,
        avg_fleet_efficiency: 94.2,
        warehouse_capacity_utilization: 76.5,
        total_orders_today: 18,
      });
    }

    // 5. Warehouses
    if (subpath === '/warehouses' && method === 'GET') {
      if (pool) {
        try {
          const dbRes = await pool.query(
            'SELECT warehouse_id as id, name, city, province, total_bins, occupied_bins, active_personnel, supports_cold_chain, latitude, longitude FROM elgs_warehouses'
          );
          if (dbRes.rows.length > 0) return jsonResponse(dbRes.rows);
        } catch (dbErr) {
          console.warn('DB warehouse query failed:', dbErr);
        }
      }
      return jsonResponse(INITIAL_WAREHOUSES);
    }

    // 6. Inventory
    if (subpath === '/inventory' && method === 'GET') {
      const warehouseId = url.searchParams.get('warehouse_id');
      if (pool) {
        try {
          let query = 'SELECT sku, warehouse_id, name, bin_code, on_hand, reserved, zone, unit_weight_kg FROM elgs_inventory';
          const queryParams: any[] = [];
          if (warehouseId) {
            query += ' WHERE warehouse_id = $1';
            queryParams.push(warehouseId);
          }
          const dbRes = await pool.query(query, queryParams);
          if (dbRes.rows.length > 0) return jsonResponse(dbRes.rows);
        } catch (dbErr) {
          console.warn('DB inventory query failed:', dbErr);
        }
      }
      let items = INITIAL_INVENTORY;
      if (warehouseId) items = items.filter((i) => i.warehouse_id === warehouseId);
      return jsonResponse(items);
    }

    if (subpath === '/inventory' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newItem = {
        sku: body.sku || `SKU-${Date.now().toString().slice(-6)}`,
        name: body.name || 'Stock Item',
        warehouse_id: body.warehouse_id || 'WH-JKT-CENTRAL',
        bin_code: body.bin_code || 'BIN-01',
        on_hand: Number(body.on_hand) || 100,
        reserved: 0,
        zone: body.zone || 'Ambient',
        unit_weight_kg: Number(body.unit_weight_kg) || 1.0,
      };
      INITIAL_INVENTORY.push(newItem);
      return jsonResponse(newItem, 201);
    }

    if (subpath === '/inventory/opname' && method === 'GET') {
      return jsonResponse([
        {
          audit_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          warehouse_id: 'WH-JKT-CENTRAL',
          sku: 'MED-VAC-001',
          system_count: 1200,
          physical_count: 1200,
          discrepancy: 0,
          counted_by: 'Farhan Maulana',
          status: 'RECONCILED',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }

    if (subpath.startsWith('/inventory/opname/') && subpath.endsWith('/approve') && method === 'POST') {
      return jsonResponse({ success: true, message: 'Stock opname approved by Logistics Manager' });
    }

    // 7. Orders Full CRUD & Workflow
    if (subpath === '/orders' && method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      if (pool) {
        try {
          let query = 'SELECT * FROM elgs_sales_orders';
          const queryParams: any[] = [];
          if (statusFilter) {
            query += ' WHERE status = $1';
            queryParams.push(statusFilter);
          }
          query += ' ORDER BY created_at DESC';
          const dbRes = await pool.query(query, queryParams);
          if (dbRes.rows.length > 0) {
            const mapped = dbRes.rows.map((row) => ({
              order_id: row.order_id,
              order_number: row.order_number,
              customer_id: row.customer_id,
              customer_name: row.customer_name,
              status: row.status,
              service_tier: row.service_tier,
              origin_warehouse_id: row.origin_warehouse_id,
              delivery_address: {
                recipient_name: row.recipient_name,
                phone: row.recipient_phone,
                street: row.recipient_street,
                city: row.recipient_city,
                province: row.recipient_province,
                postal_code: row.recipient_postal,
                latitude: row.latitude,
                longitude: row.longitude,
              },
              tracking_number: row.tracking_number,
              total_amount: Number(row.total_amount),
              total_weight_kg: Number(row.total_weight_kg),
              items: [],
              created_at: row.created_at,
              updated_at: row.updated_at,
            }));
            return jsonResponse(mapped);
          }
        } catch (dbErr) {
          console.warn('DB orders query failed:', dbErr);
        }
      }
      let list = ordersStore;
      if (statusFilter) list = list.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
      return jsonResponse(list);
    }

    if (subpath === '/orders' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newOrder = {
        order_id: crypto.randomUUID(),
        order_number: `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        customer_id: body.customer_id || 'CUST-GENERAL',
        customer_name: body.customer_name || 'Corporate Client',
        items: body.items || [],
        status: 'Draft',
        service_tier: body.service_tier || 'Standard',
        origin_warehouse_id: body.origin_warehouse_id || 'WH-JKT-CENTRAL',
        delivery_address: body.delivery_address || {
          recipient_name: 'Recipient Name',
          phone: '+62 812-0000-0000',
          street: 'Jl. Jenderal Sudirman',
          city: 'Jakarta Pusat',
          province: 'DKI Jakarta',
          postal_code: '10220',
          latitude: -6.2146,
          longitude: 106.8188,
        },
        tracking_number: `TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
        total_amount: Number(body.total_amount) || 15000000.0,
        total_weight_kg: Number(body.total_weight_kg) || 10.0,
        created_by: currentUser.user_id,
        approved_by: null,
        notes: body.notes || 'Created via ELGS Portal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      ordersStore.unshift(newOrder);
      return jsonResponse(newOrder, 201);
    }

    if (subpath.startsWith('/orders/') && !subpath.includes('/reserve') && !subpath.includes('/transition')) {
      const orderId = subpath.replace('/orders/', '');
      const order = ordersStore.find((o) => o.order_id === orderId || o.order_number === orderId);
      if (method === 'GET') {
        if (!order) return jsonResponse({ error: 'Order not found' }, 404);
        return jsonResponse(order);
      }
      if (method === 'PUT') {
        const body = await request.json().catch(() => ({}));
        if (order) Object.assign(order, body, { updated_at: new Date().toISOString() });
        return jsonResponse(order || body);
      }
      if (method === 'DELETE') {
        ordersStore = ordersStore.filter((o) => o.order_id !== orderId && o.order_number !== orderId);
        return jsonResponse({ success: true, message: 'Order deleted' });
      }
    }

    if (subpath.startsWith('/orders/') && subpath.endsWith('/reserve') && method === 'POST') {
      const orderId = subpath.replace('/orders/', '').replace('/reserve', '');
      const order = ordersStore.find((o) => o.order_id === orderId);
      if (order) {
        order.status = 'InventoryReserved';
        order.updated_at = new Date().toISOString();
      }
      return jsonResponse({ success: true, status: 'InventoryReserved', order });
    }

    if (subpath.startsWith('/orders/') && subpath.endsWith('/transition') && method === 'POST') {
      const orderId = subpath.replace('/orders/', '').replace('/transition', '');
      const body = await request.json().catch(() => ({}));
      const nextStatus = body.status || 'InTransit';
      const order = ordersStore.find((o) => o.order_id === orderId);
      if (order) {
        order.status = nextStatus;
        order.updated_at = new Date().toISOString();
      }
      return jsonResponse({ success: true, status: nextStatus, order });
    }

    // 8. Fleet & Drivers
    if (subpath === '/fleet' && method === 'GET') {
      if (pool) {
        try {
          const [vehRes, drvRes] = await Promise.all([
            pool.query('SELECT * FROM elgs_vehicles'),
            pool.query('SELECT * FROM elgs_drivers'),
          ]);
          if (vehRes.rows.length > 0 || drvRes.rows.length > 0) {
            return jsonResponse({
              vehicles: vehRes.rows,
              drivers: drvRes.rows,
            });
          }
        } catch (dbErr) {
          console.warn('DB fleet query failed:', dbErr);
        }
      }
      return jsonResponse(fleetStore);
    }

    if (subpath === '/fleet/vehicles' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newVeh = {
        vehicle_id: body.vehicle_id || `VEH-${Date.now().toString().slice(-4)}`,
        license_plate: body.license_plate || 'B 1234 XYZ',
        vehicle_type: body.vehicle_type || 'ElectricRefrigeratedVan',
        max_payload_kg: Number(body.max_payload_kg) || 2000.0,
        current_payload_kg: 0.0,
        status: 'Active',
        fuel_battery_percent: 100,
        odometer_km: 0.0,
        current_lat: -6.2088,
        current_lng: 106.8456,
      };
      fleetStore.vehicles.push(newVeh);
      return jsonResponse(newVeh, 201);
    }

    if (subpath === '/fleet/drivers' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newDrv = {
        driver_id: body.driver_id || `DRV-${Date.now().toString().slice(-3)}`,
        name: body.name || 'Driver Name',
        phone: body.phone || '+62 812-0000-0000',
        license_type: body.license_type || 'SIM B2 Umum',
        status: 'Available',
        rating: 5.0,
        assigned_vehicle_id: body.assigned_vehicle_id || null,
        consecutive_driving_hours: 0.0,
        fatigue_warning: false,
      };
      fleetStore.drivers.push(newDrv);
      return jsonResponse(newDrv, 201);
    }

    // 9. Tracking Telemetry
    if (subpath.startsWith('/tracking/') && method === 'GET') {
      const trackingNumber = subpath.replace('/tracking/', '');
      const order = ordersStore.find((o) => o.tracking_number === trackingNumber) || ordersStore[0];
      return jsonResponse({
        tracking_number: trackingNumber,
        order_number: order.order_number,
        current_status: order.status,
        service_tier: order.service_tier,
        cold_chain_telemetry: {
          temperature_c: -19.4,
          humidity_percent: 45,
          battery_percent: 92,
          sensor_health: 'NORMAL',
          last_telemetry_at: new Date().toISOString(),
        },
        current_coordinates: {
          latitude: -6.2088,
          longitude: 106.8456,
        },
        timeline: [
          {
            stage: 'OrderCreated',
            description: 'Sales Order placed by customer',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            location: 'Jakarta Hub',
          },
          {
            stage: 'InventoryReserved',
            description: 'Biopharmaceutical stock locked in cold vault CC-RACK-01',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            location: 'Jakarta Central Hub',
          },
          {
            stage: 'InTransit',
            description: 'En route with electric refrigerated carrier VEH-EV-01',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            location: 'Jl. Rasuna Said, Jakarta',
          },
        ],
      });
    }

    // 10. Finance & Invoices
    if (subpath === '/finance/calculate-rate' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const weight = Number(body.weight_kg) || 1.0;
      const isColdChain = body.service_tier === 'ColdChainExpress';
      const baseTariff = 50000;
      const weightTariff = weight * 12500;
      const coldChainSurcharge = isColdChain ? 150000 : 0;
      const subtotal = baseTariff + weightTariff + coldChainSurcharge;
      const ppn11 = subtotal * 0.11;
      return jsonResponse({
        base_tariff: baseTariff,
        weight_tariff: weightTariff,
        cold_chain_surcharge: coldChainSurcharge,
        subtotal,
        ppn_tax: ppn11,
        total_estimate: subtotal + ppn11,
      });
    }

    if (subpath === '/finance/invoices' && method === 'GET') {
      if (pool) {
        try {
          const dbRes = await pool.query('SELECT * FROM elgs_invoices ORDER BY created_at DESC');
          if (dbRes.rows.length > 0) return jsonResponse(dbRes.rows);
        } catch (dbErr) {
          console.warn('DB invoices query failed:', dbErr);
        }
      }
      return jsonResponse(invoicesStore);
    }

    if (subpath === '/finance/invoices' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const subtotal = Number(body.subtotal) || 10000000;
      const tax = subtotal * 0.11;
      const newInvoice = {
        invoice_id: crypto.randomUUID(),
        invoice_number: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        order_id: body.order_id || null,
        customer_id: body.customer_id || 'CUST-GENERAL',
        customer_name: body.customer_name || 'Corporate Customer',
        subtotal,
        tax_amount: tax,
        total_amount: subtotal + tax,
        status: 'Issued',
        due_date: new Date(Date.now() + 86400000 * 14).toISOString(),
        created_at: new Date().toISOString(),
      };
      invoicesStore.unshift(newInvoice);
      return jsonResponse(newInvoice, 201);
    }

    if (subpath.startsWith('/finance/invoices/') && subpath.endsWith('/settle') && method === 'POST') {
      const invoiceId = subpath.replace('/finance/invoices/', '').replace('/settle', '');
      const invoice = invoicesStore.find((i) => i.invoice_id === invoiceId || i.invoice_number === invoiceId);
      if (invoice) invoice.status = 'Paid';
      return jsonResponse({ success: true, message: 'Invoice marked as Paid', invoice });
    }

    // 11. Developer Sandbox Simulation Routes
    if (subpath.startsWith('/sandbox/')) {
      if (subpath === '/sandbox/status') {
        return jsonResponse({
          sandbox_active: true,
          mode: 'Isolated In-Memory Simulation',
          database_write_protected: true,
          timestamp: new Date().toISOString(),
        });
      }
      if (subpath === '/sandbox/auth/token') {
        return jsonResponse({
          access_token: `sb_token_${crypto.randomBytes(16).toString('hex')}`,
          token_type: 'Bearer',
          expires_in: 86400,
        });
      }
      if (subpath === '/sandbox/orders') {
        if (method === 'GET') return jsonResponse(ordersStore);
        const body = await request.json().catch(() => ({}));
        return jsonResponse(
          {
            sandbox_order_id: crypto.randomUUID(),
            status: 'Draft',
            ...body,
          },
          201
        );
      }
      if (subpath === '/sandbox/reset') {
        return jsonResponse({ message: 'Sandbox environment reset to seed state' });
      }
      return jsonResponse({ sandbox: true, path: subpath });
    }

    return jsonResponse(
      {
        error: 'Not Found',
        message: `API endpoint '/api/v1${subpath}' is not defined.`,
      },
      404
    );
  } catch (err: any) {
    console.error('API Error:', err);
    return jsonResponse(
      {
        error: 'Internal Server Error',
        message: err?.message || 'Unexpected server error',
      },
      500
    );
  }
};
