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
} from '../types/logistics';

const API_BASE = 'http://localhost:8080/api/v1';

export const LogisticsApi = {
  async getHealth(): Promise<{ status: string; service: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'mock_active', service: 'NexusLogistics Telemetry Hub' };
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
          notes: 'Handle with care: fragile server equipment',
          created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: '3c4d5e6f-0003-4000-8000-333344445555',
          order_number: 'ORD-20261122-GAMMA03',
          customer_id: 'CUST-PLN-NUSANTARA',
          customer_name: 'PLN Nusantara Power',
          items: [
            {
              item_id: 'item-3',
              sku: 'IND-SOL-109',
              name: 'Solar Inverter Controller 5kW',
              quantity: 15,
              unit_price: 24000000,
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
          total_amount: 360000000,
          total_weight_kg: 180,
          notes: '',
          created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        },
      ];
    }
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
          sku: 'AUTO-ECU-88',
          name: 'Automotive Telematic ECU Unit',
          warehouse_id: 'WH-BDG-WEST',
          bin_code: 'AMB-ROW-04',
          on_hand: 1500,
          reserved: 200,
          zone: 'Ambient',
          unit_weight_kg: 0.45,
        },
      ];
    }
  },

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
          {
            id: 'VH-EVAN-02',
            license_plate: 'B 2049 EV',
            vehicle_type: 'ElectricVan',
            max_payload_kg: 1200,
            current_payload_kg: 640,
            status: 'Dispatched',
            fuel_battery_level_percent: 92,
            odometer_km: 12450,
            current_lat: -6.1852,
            current_lng: 106.8312,
          },
          {
            id: 'VH-TRAILER-03',
            license_plate: 'L 8412 UZ',
            vehicle_type: 'HeavyDutyTrailer',
            max_payload_kg: 24000,
            current_payload_kg: 0,
            status: 'Available',
            fuel_battery_level_percent: 98,
            odometer_km: 112000,
            current_lat: -7.2575,
            current_lng: 112.7521,
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
          {
            id: 'DRV-102',
            name: 'Agus Pratama',
            phone: '+62 813-7722-4412',
            license_type: 'A (Commercial Light)',
            status: 'OnRoute',
            rating: 4.88,
            assigned_vehicle_id: 'VH-EVAN-02',
            consecutive_driving_hours: 1.8,
            fatigue_warning: false,
          },
        ],
      };
    }
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
          {
            event_id: 'ev-2',
            tracking_number: trackingNumber,
            status: 'DISPATCHED',
            location_name: 'Jakarta Hub Gate 4',
            description: 'Cargo loaded onto Reefer Truck VH-REEFER-01 (Driver: Bambang P.)',
            timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          },
          {
            event_id: 'ev-3',
            tracking_number: trackingNumber,
            status: 'IN_TRANSIT',
            location_name: 'Rasuna Said Corridor',
            description: 'In transit with live cold telemetry monitoring',
            timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
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
      // Local calculation fallback adhering to same formula
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
          due_date: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          invoice_id: 'inv-2',
          invoice_number: 'INV-2026-00810',
          order_id: 'order-3',
          customer_id: 'CUST-PLN-NUSANTARA',
          customer_name: 'PLN Nusantara Power',
          subtotal: 360000000,
          tax_amount: 39600000,
          total_amount: 399600000,
          status: 'Paid',
          due_date: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
          created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        },
      ];
    }
  },
};
