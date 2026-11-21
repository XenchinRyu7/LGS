export type UserRole =
  | 'SuperAdmin'
  | 'LogisticsManager'
  | 'WarehouseOperator'
  | 'FleetDispatcher'
  | 'FinanceAuditor'
  | 'Driver';

export interface AuthUser {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface AuditRecord {
  audit_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state?: string;
  after_state?: string;
  ip_address: string;
  hash_signature: string;
  timestamp: string;
}

export type OrderStatus =
  | 'Draft'
  | 'Confirmed'
  | 'InventoryReserved'
  | 'Picking'
  | 'Packed'
  | 'Dispatched'
  | 'InTransit'
  | 'OutForDelivery'
  | 'Delivered'
  | 'FailedDelivery'
  | 'Returned'
  | 'Cancelled';

export type ServiceTier = 'Standard' | 'Express' | 'SameDay' | 'ColdChainPriority';

export interface OrderItem {
  item_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  weight_kg: number;
  volume_cbm: number;
}

export interface Address {
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  items: OrderItem[];
  status: OrderStatus;
  service_tier: ServiceTier;
  origin_warehouse_id: string;
  delivery_address: Address;
  tracking_number: string;
  total_amount: number;
  total_weight_kg: number;
  created_by?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type StorageZone = 'Ambient' | 'ColdStorage' | 'HighValueSecure' | 'HazardousGoods';

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  province: string;
  total_bins: number;
  occupied_bins: number;
  active_personnel: number;
  supports_cold_chain: boolean;
  latitude: number;
  longitude: number;
}

export interface WarehouseStock {
  sku: string;
  name: string;
  warehouse_id: string;
  bin_code: string;
  on_hand: number;
  reserved: number;
  zone: StorageZone;
  unit_weight_kg: number;
}

export interface StockOpnameAudit {
  audit_id: string;
  warehouse_id: string;
  sku: string;
  system_count: number;
  physical_count: number;
  discrepancy: number;
  counted_by: string;
  approved_by?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  notes?: string;
  timestamp: string;
}

export type VehicleType = 'MotorcycleCargo' | 'ElectricVan' | 'ReeferColdTruck' | 'HeavyDutyTrailer';
export type VehicleStatus = 'Available' | 'Dispatched' | 'InMaintenance' | 'OffDuty';

export interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: VehicleType;
  max_payload_kg: number;
  current_payload_kg: number;
  status: VehicleStatus;
  fuel_battery_level_percent: number;
  odometer_km: number;
  current_lat: number;
  current_lng: number;
}

export type DriverStatus = 'Ready' | 'OnRoute' | 'Resting' | 'Offline';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license_type: string;
  status: DriverStatus;
  rating: number;
  assigned_vehicle_id?: string;
  consecutive_driving_hours: number;
  fatigue_warning: boolean;
}

export interface LiveGpsTelemetry {
  tracking_number: string;
  vehicle_id: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_degrees: number;
  temperature_celsius?: number;
  battery_fuel_percent: number;
  eta_minutes: number;
  timestamp: string;
}

export interface TrackingTimelineEvent {
  event_id: string;
  tracking_number: string;
  status: string;
  location_name: string;
  description: string;
  timestamp: string;
}

export interface TrackingView {
  tracking_number: string;
  order_number: string;
  recipient_name: string;
  destination_city: string;
  current_status: string;
  events: TrackingTimelineEvent[];
  live_telemetry?: LiveGpsTelemetry;
  estimated_delivery: string;
}

export interface ShippingRateQuoteRequest {
  origin_city: string;
  destination_city: string;
  actual_weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  requires_cold_chain: boolean;
  is_express: boolean;
}

export interface ShippingRateQuoteResponse {
  volumetric_weight_kg: number;
  chargeable_weight_kg: number;
  base_rate: number;
  fuel_surcharge: number;
  cold_chain_surcharge: number;
  express_multiplier: number;
  total_shipping_cost: number;
  estimated_transit_days: number;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Overdue' | 'Cancelled';
  created_by?: string;
  settled_by?: string;
  due_date: string;
  created_at: string;
}

export interface ExecutiveAnalyticsSummary {
  total_orders_today: number;
  active_shipments_in_transit: number;
  on_time_delivery_rate_percent: number;
  fleet_utilization_percent: number;
  warehouse_utilization_percent: number;
  total_revenue_today: number;
  average_fulfillment_time_hours: number;
  temperature_breaches_cold_chain: number;
}

export interface ThroughputPoint {
  label: string;
  value: number;
  secondary: number;
}
