import React, { useState, useEffect } from 'react';
import {
  Truck,
  BatteryCharging,
  Gauge,
  UserCheck,
  AlertOctagon,
  Send,
  X,
  Plus,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { Vehicle, Driver, VehicleType } from '../../types/logistics';

export function FleetDispatch() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('DRV-101');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('VH-REEFER-01');
  const [banner, setBanner] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // New vehicle form
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState<VehicleType>('ElectricVan');
  const [newPayload, setNewPayload] = useState(1500);

  // New driver form
  const [newDriverId, setNewDriverId] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('+62 812-');
  const [newLicense, setNewLicense] = useState('B2 Umum (Heavy)');

  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    try {
      const res = await LogisticsApi.listFleet();
      setVehicles(Array.isArray(res?.vehicles) ? res.vehicles : []);
      setDrivers(Array.isArray(res?.drivers) ? res.drivers : []);
    } catch {
      setVehicles([]);
      setDrivers([]);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleId || !newPlate) return;
    try {
      const v = await LogisticsApi.createVehicle({
        id: newVehicleId,
        license_plate: newPlate,
        vehicle_type: newType,
        max_payload_kg: Number(newPayload),
        fuel_battery_level_percent: 100,
        current_lat: -6.2088,
        current_lng: 106.8456,
      });
      setVehicles([...vehicles, v]);
      setIsVehicleModalOpen(false);
      setBanner(`✅ Fleet vehicle ${v.license_plate} (${v.id}) registered.`);
    } catch (err: any) {
      setBanner(`❌ Failed to add vehicle: ${err.message}`);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverId || !newDriverName) return;
    try {
      const d = await LogisticsApi.createDriver({
        id: newDriverId,
        name: newDriverName,
        phone: newDriverPhone,
        license_type: newLicense,
      });
      setDrivers([...drivers, d]);
      setIsDriverModalOpen(false);
      setBanner(`✅ Driver ${d.name} (${d.id}) enrolled in roster.`);
    } catch (err: any) {
      setBanner(`❌ Failed to enroll driver: ${err.message}`);
    }
  };

  const handleDispatch = () => {
    setBanner(`🚀 Route dispatched: Vehicle ${selectedVehicle} paired with Driver ${selectedDriver}`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-xs text-foreground shadow-sm">
          <span>{banner}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Fleet Telematics Overview */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 className="text-sm font-bold text-card-foreground">Active Fleet Units</h3>
            <p className="text-xs text-muted-foreground">Payload allocation and battery/fuel index</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Vehicle</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDriverModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Enroll Driver</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const payloadPercent = Math.round((v.current_payload_kg / v.max_payload_kg) * 100);
            return (
              <div
                key={v.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{v.license_plate}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{v.id}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      v.status === 'Dispatched'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cargo Payload</span>
                    <span className="font-mono font-medium text-foreground">
                      {v.current_payload_kg} / {v.max_payload_kg} kg ({payloadPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${payloadPercent}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-mono font-semibold text-foreground">
                      {v.fuel_battery_level_percent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                    <Gauge className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-foreground">{(v.odometer_km ?? 0).toLocaleString()} km</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Rostering & Fatigue Risk Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Commercial Driver Telemetry</h3>
              <p className="text-xs text-muted-foreground">Fatigue tracking &amp; safety rating</p>
            </div>
            <UserCheck className="h-4 w-4 text-primary" />
          </div>

          <div className="divide-y divide-border/60">
            {drivers.map((drv) => (
              <div key={drv.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {drv.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{drv.name}</p>
                    <p className="text-[10px] text-muted-foreground">{drv.license_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Driving Time</span>
                    <p className="font-mono font-medium text-foreground">
                      {drv.consecutive_driving_hours} hrs
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Safety Score</span>
                    <p className="font-mono font-bold text-emerald-400">{drv.rating} / 5.0</p>
                  </div>
                  <div>
                    {drv.fatigue_warning ? (
                      <span className="flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        <AlertOctagon className="h-3 w-3" /> Fatigue
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Nominal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Planner Box */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-card-foreground">Route Dispatch Console</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-foreground">Assign Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.license_plate} ({v.vehicle_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">Assign Commercial Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDispatch}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-bold text-primary-foreground shadow hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
              <span>Broadcast Dispatch Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">Register Fleet Vehicle</h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Vehicle Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VH-EVAN-05"
                  value={newVehicleId}
                  onChange={(e) => setNewVehicleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B 8899 EV"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Vehicle Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as VehicleType)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ElectricVan">Electric Van (EV)</option>
                    <option value="ReeferColdTruck">Reefer Cold Truck (-20°C)</option>
                    <option value="HeavyDutyTrailer">Heavy Duty Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Max Payload (kg)</label>
                  <input
                    type="number"
                    min="100"
                    value={newPayload}
                    onChange={(e) => setNewPayload(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Driver Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">Enroll Commercial Driver</h3>
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Driver ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DRV-105"
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hendro Suwito"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Commercial License</label>
                  <select
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="B2 Umum (Heavy)">B2 Umum (Heavy Trailer)</option>
                    <option value="B1 (Commercial Truck)">B1 (Commercial Truck)</option>
                    <option value="A (Commercial Light)">A (Commercial Light Van)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Enroll Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
