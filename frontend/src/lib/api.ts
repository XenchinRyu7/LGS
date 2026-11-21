import type {
  SalesOrder,
  Warehouse,
  WarehouseStock,
  Vehicle,
  Driver,
  TrackingView,
  ShippingRateQuoteRequest,
  ShippingRateQuoteResponse,
  Invoice,
  ExecutiveAnalyticsSummary,
  ThroughputPoint,
  OrderStatus,
  AuthUser,
  UserRole,
  AuditRecord,
  StockOpnameAudit,
  StorageZone,
  VehicleType,
} from '../types/logistics';

const API_BASE = 'http://localhost:8080/api/v1';

export const LogisticsApi = {
  async getHealth(): Promise<{ status: string; service: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'mock_active', service: 'ELGS — Ethereal Logistics Engine' };
    }
  },

  // IAM & RBAC
  async getCurrentUser(): Promise<{ user: AuthUser; permissions: string[] }> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`);
      if (!res.ok) throw new Error('Failed to fetch session user');
      return await res.json();
    } catch {
      return {
        user: {
          user_id: '00000000-0000-4000-8000-000000000001',
          full_name: 'Alexander Hartono (Super Admin)',
          email: 'alexander.hartono@elgs.enterprise.id',
          role: 'SuperAdmin',
          department: 'Enterprise Operations',
        },
        permissions: ['OrderRead', 'OrderCreate', 'OrderUpdate', 'OrderDelete', 'OrderApprove', 'OrderReserve', 'OrderTransition', 'WarehouseRead', 'WarehouseManage', 'StockOpnameSubmit', 'StockOpnameApprove', 'FleetRead', 'FleetManage', 'RouteDispatch', 'PodSubmit', 'FinanceRead', 'InvoiceCreate', 'InvoiceSettle', 'AuditTrailRead', 'SecurityAdmin'],
      };
    }
  },

  async switchRole(role: UserRole): Promise<{ user: AuthUser; permissions: string[]; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/switch-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to switch role');
      return await res.json();
    } catch {
      const mockRoles: Record<UserRole, AuthUser> = {
        SuperAdmin: {
          user_id: '00000000-0000-4000-8000-000000000001',
          full_name: 'Alexander Hartono (Super Admin)',
          email: 'alexander.hartono@elgs.enterprise.id',
          role: 'SuperAdmin',
          department: 'Enterprise Operations',
        },
        LogisticsManager: {
          user_id: '00000000-0000-4000-8000-000000000002',
          full_name: 'Diana Puspita (Logistics Manager)',
          email: 'diana.puspita@elgs.enterprise.id',
          role: 'LogisticsManager',
          department: 'Fulfillment Management',
        },
        WarehouseOperator: {
          user_id: '00000000-0000-4000-8000-000000000003',
          full_name: 'Farhan Maulana (Warehouse Lead)',
          email: 'farhan.maulana@elgs.enterprise.id',
          role: 'WarehouseOperator',
          department: 'Warehouse & Cryo Vault',
        },
        FleetDispatcher: {
          user_id: '00000000-0000-4000-8000-000000000004',
          full_name: 'Satria Wicaksono (Fleet Dispatcher)',
          email: 'satria.wicaksono@elgs.enterprise.id',
          role: 'FleetDispatcher',
          department: 'Fleet Telematics',
        },
        FinanceAuditor: {
          user_id: '00000000-0000-4000-8000-000000000005',
          full_name: 'Evelyn Wijaya (Finance Auditor)',
          email: 'evelyn.wijaya@elgs.enterprise.id',
          role: 'FinanceAuditor',
          department: 'Treasury & Internal Audit',
        },
        Driver: {
          user_id: '00000000-0000-4000-8000-000000000006',
          full_name: 'Bambang Pamungkas (Senior Driver)',
          email: 'bambang.driver@elgs.enterprise.id',
          role: 'Driver',
          department: 'Fleet Operations',
        },
      };
      return {
        user: mockRoles[role],
        permissions: ['OrderRead'],
        message: `Switched active role to ${mockRoles[role].full_name}`,
      };
    }
  },

  async listAuditTrail(): Promise<AuditRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/audit-trail`);
      if (!res.ok) throw new Error('Failed to fetch audit trail');
      const data = await res.json();
      return data.audit_logs;
    } catch {
      return [
        {
          audit_id: 'aud-01',
          actor_id: '00000000-0000-4000-8000-000000000001',
          actor_name: 'Alexander Hartono',
          actor_role: 'SuperAdmin',
          action: 'SYSTEM_BOOTSTRAP',
          resource_type: 'ELGS_CORE',
          resource_id: 'INIT',
          after_state: 'Genesis state initialized with SOC-2 non-repudiation',
          ip_address: '127.0.0.1',
          hash_signature: '7e9c5f812a149b01',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          audit_id: 'aud-02',
          actor_id: '00000000-0000-4000-8000-000000000002',
          actor_name: 'Diana Puspita',
          actor_role: 'LogisticsManager',
          action: 'ORDER_CREATED',
          resource_type: 'SalesOrder',
          resource_id: 'ORD-20261122-ALPHA01',
          after_state: 'Created sales order with total Rp 52,500,000',
          ip_address: '192.168.1.10',
          hash_signature: '9a3b8c71e2f41052',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          audit_id: 'aud-03',
          actor_id: '00000000-0000-4000-8000-000000000001',
          actor_name: 'Alexander Hartono',
          actor_role: 'SuperAdmin',
          action: 'ORDER_APPROVED',
          resource_type: 'SalesOrder',
          resource_id: 'ORD-20261122-ALPHA01',
          before_state: 'Draft',
          after_state: 'InventoryReserved - Maker-checker verified',
          ip_address: '192.168.1.1',
          hash_signature: 'b4c7d8e9f0123456',
          timestamp: new Date(Date.now() - 900000).toISOString(),
        },
      ];
    }
  },

  async getExecutiveOverview(): Promise<{
    metrics: ExecutiveAnalyticsSummary;
    throughput: ThroughputPoint[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return await res.json();
    } catch {
      return {
        metrics: {
          total_orders_today: 145,
          active_shipments_in_transit: 21,
          on_time_delivery_rate_percent: 98.4,
          fleet_utilization_percent: 87.5,
          warehouse_utilization_percent: 74.2,
          total_revenue_today: 1292500000,
          average_fulfillment_time_hours: 3.4,
          temperature_breaches_cold_chain: 0,
        },
        throughput: [
          { label: '06:00', value: 14, secondary: 8 },
          { label: '08:00', value: 45, secondary: 22 },
          { label: '10:00', value: 88, secondary: 64 },
          { label: '12:00', value: 120, secondary: 95 },
          { label: '14:00', value: 165, secondary: 130 },
          { label: '16:00', value: 210, secondary: 185 },
          { label: '18:00', value: 248, secondary: 232 },
        ],
      };
    }
  },

  // Orders CRUD
  async listOrders(status?: OrderStatus): Promise<SalesOrder[]> {
    try {
      const url = status ? `${API_BASE}/orders?status=${status}` : `${API_BASE}/orders`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to list orders');
      const data = await res.json();
      return data.orders;
    } catch {
      return [
        {
          id: '1a2b3c4d-0001-4000-8000-111122223333',
          order_number: 'ORD-20261122-ALPHA01',
          customer_id: 'CUST-KIMIA-FARMA',
          customer_name: 'PT Kimia Farma Diagnostics',
          items: [
            {
              item_id: 'item-1',
              sku: 'MED-VAC-001',
              name: 'Bio-Pharmaceutical Vaccine Pack (-20C)',
              quantity: 150,
              unit_price: 350000,
              weight_kg: 0.8,
              volume_cbm: 0.002,
            },
          ],
          status: 'InTransit',
          service_tier: 'ColdChainPriority',
          origin_warehouse_id: 'WH-JKT-CENTRAL',
          delivery_address: {
            recipient_name: 'Dr. Hendra Gunawan',
            phone: '+62 821-4455-6677',
            street: 'Jl. Diponegoro No. 71, Menteng',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postal_code: '10310',
            latitude: -6.1963,
            longitude: 106.8489,
          },
          tracking_number: 'TRK-ALPHA01',
          total_amount: 52500000,
          total_weight_kg: 120,
          created_by: '00000000-0000-4000-8000-000000000002',
          approved_by: '00000000-0000-4000-8000-000000000001',
          notes: 'Temperature sensitive: Keep between -25C and -15C',
          created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        },
        {
          id: '2b3c4d5e-0002-4000-8000-222233334444',
          order_number: 'ORD-20261122-BETA02',
          customer_id: 'CUST-TELKOM',
          customer_name: 'Telkom Data Infrastructure',
          items: [
            {
              item_id: 'item-2',
              sku: 'ELEC-SRV-042',
              name: 'Enterprise Edge Gateway Server',
              quantity: 20,
              unit_price: 18500000,
              weight_kg: 6.5,
              volume_cbm: 0.025,
            },
          ],
          status: 'Picking',
          service_tier: 'Express',
          origin_warehouse_id: 'WH-JKT-CENTRAL',
          delivery_address: {
            recipient_name: 'Budi Santoso, ST',
            phone: '+62 815-9988-1234',
            street: 'Jl. Gatot Subroto Kav. 52',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postal_code: '12710',
            latitude: -6.2384,
            longitude: 106.8315,
          },
          tracking_number: 'TRK-BETA02',
          total_amount: 370000000,
          total_weight_kg: 130,
          created_by: '00000000-0000-4000-8000-000000000002',
          notes: 'Handle with care: fragile server equipment',
          created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ];
    }
  },

  async createOrder(payload: any): Promise<SalesOrder> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return await res.json();
  },

  async updateOrder(orderId: string, payload: any): Promise<SalesOrder> {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update order');
    }
    return await res.json();
  },

  async deleteOrder(orderId: string): Promise<SalesOrder> {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel order');
    }
    return await res.json();
  },

  async reserveStock(orderId: string): Promise<SalesOrder> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/reserve`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reserve stock');
    }
    return await res.json();
  },

  async transitionStatus(orderId: string, targetStatus: OrderStatus): Promise<SalesOrder> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_status: targetStatus }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to transition order status');
    }
    return await res.json();
  },

  // Warehouses & Inventory
  async listWarehouses(): Promise<Warehouse[]> {
    try {
      const res = await fetch(`${API_BASE}/warehouses`);
      if (!res.ok) throw new Error('Failed to list warehouses');
      const data = await res.json();
      return data.warehouses;
    } catch {
      return [
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
    }
  },

  async listInventory(warehouseId?: string): Promise<WarehouseStock[]> {
    try {
      const url = warehouseId
        ? `${API_BASE}/inventory?warehouse_id=${warehouseId}`
        : `${API_BASE}/inventory`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      return data.inventory;
    } catch {
      return [
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
      ];
    }
  },

  async createStock(payload: {
    sku: string;
    name: string;
    warehouse_id: string;
    bin_code: string;
    initial_quantity: number;
    zone: StorageZone;
    unit_weight_kg: number;
  }): Promise<WarehouseStock> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create stock item');
    }
    return await res.json();
  },

  async listOpnames(): Promise<StockOpnameAudit[]> {
    try {
      const res = await fetch(`${API_BASE}/inventory/opname`);
      if (!res.ok) throw new Error('Failed to fetch opname audits');
      const data = await res.json();
      return data.opnames;
    } catch {
      return [];
    }
  },

  async approveOpname(auditId: string): Promise<StockOpnameAudit> {
    const res = await fetch(`${API_BASE}/inventory/opname/${auditId}/approve`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to approve opname variance');
    }
    return await res.json();
  },

  // Fleet
  async listFleet(): Promise<{ vehicles: Vehicle[]; drivers: Driver[] }> {
    try {
      const res = await fetch(`${API_BASE}/fleet`);
      if (!res.ok) throw new Error('Failed to fetch fleet');
      return await res.json();
    } catch {
      return {
        vehicles: [
          {
            id: 'VH-REEFER-01',
            license_plate: 'B 9142 SXY',
            vehicle_type: 'ReeferColdTruck',
            max_payload_kg: 3500,
            current_payload_kg: 2100,
            status: 'Dispatched',
            fuel_battery_level_percent: 84,
            odometer_km: 48200,
            current_lat: -6.2297,
            current_lng: 106.8295,
          },
        ],
        drivers: [
          {
            id: 'DRV-101',
            name: 'Bambang Pamungkas',
            phone: '+62 812-8899-1001',
            license_type: 'B2 Umum (Heavy)',
            status: 'OnRoute',
            rating: 4.92,
            assigned_vehicle_id: 'VH-REEFER-01',
            consecutive_driving_hours: 2.5,
            fatigue_warning: false,
          },
        ],
      };
    }
  },

  async createVehicle(payload: {
    id: string;
    license_plate: string;
    vehicle_type: VehicleType;
    max_payload_kg: number;
    fuel_battery_level_percent: number;
    current_lat: number;
    current_lng: number;
  }): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/fleet/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create vehicle');
    }
    return await res.json();
  },

  async createDriver(payload: {
    id: string;
    name: string;
    phone: string;
    license_type: string;
  }): Promise<Driver> {
    const res = await fetch(`${API_BASE}/fleet/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create driver');
    }
    return await res.json();
  },

  async getTracking(trackingNumber: string): Promise<TrackingView> {
    try {
      const res = await fetch(`${API_BASE}/tracking/${trackingNumber}`);
      if (!res.ok) throw new Error('Tracking number not found');
      return await res.json();
    } catch {
      return {
        tracking_number: trackingNumber,
        order_number: 'ORD-20261122-ALPHA01',
        recipient_name: 'Dr. Hendra Gunawan',
        destination_city: 'Jakarta',
        current_status: 'InTransit',
        events: [
          {
            event_id: 'ev-1',
            tracking_number: trackingNumber,
            status: 'PICKED',
            location_name: 'WH-JKT-CENTRAL Cold Vault',
            description: 'Vaccine cargo packed with dry ice logger (-20.4C verified)',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          },
        ],
        live_telemetry: {
          tracking_number: trackingNumber,
          vehicle_id: 'VH-REEFER-01',
          driver_name: 'Bambang Pamungkas',
          latitude: -6.2297,
          longitude: 106.8295,
          speed_kmh: 42.5,
          heading_degrees: 148,
          temperature_celsius: -20.2,
          battery_fuel_percent: 84,
          eta_minutes: 24,
          timestamp: new Date().toISOString(),
        },
        estimated_delivery: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      };
    }
  },

  async calculateTariff(payload: ShippingRateQuoteRequest): Promise<ShippingRateQuoteResponse> {
    try {
      const res = await fetch(`${API_BASE}/finance/calculate-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to calculate rate');
      return await res.json();
    } catch {
      const volumetric = (payload.length_cm * payload.width_cm * payload.height_cm) / 5000;
      const chargeable = Math.max(payload.actual_weight_kg, volumetric, 1);
      const base = chargeable * (payload.origin_city === payload.destination_city ? 15000 : 35000);
      const fuel = base * 0.05;
      const cold = payload.requires_cold_chain ? base * 0.35 : 0;
      const multiplier = payload.is_express ? 1.5 : 1.0;
      const total = (base + fuel + cold) * multiplier;

      return {
        volumetric_weight_kg: Math.round(volumetric * 100) / 100,
        chargeable_weight_kg: Math.round(chargeable * 100) / 100,
        base_rate: Math.round(base),
        fuel_surcharge: Math.round(fuel),
        cold_chain_surcharge: Math.round(cold),
        express_multiplier: multiplier,
        total_shipping_cost: Math.round(total),
        estimated_transit_days: payload.is_express ? 1 : 2,
      };
    }
  },

  async listInvoices(): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE}/finance/invoices`);
      if (!res.ok) throw new Error('Failed to list invoices');
      const data = await res.json();
      return data.invoices;
    } catch {
      return [
        {
          invoice_id: 'inv-1',
          invoice_number: 'INV-2026-00812',
          order_id: 'order-1',
          customer_id: 'CUST-KIMIA-FARMA',
          customer_name: 'PT Kimia Farma Diagnostics',
          subtotal: 52500000,
          tax_amount: 5775000,
          total_amount: 58275000,
          status: 'Issued',
          created_by: '00000000-0000-4000-8000-000000000005',
          due_date: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
      ];
    }
  },

  async settleInvoice(invoiceId: string): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/finance/invoices/${invoiceId}/settle`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to settle invoice');
    }
    return await res.json();
  },
};
