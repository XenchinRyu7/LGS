import React, { useState, useEffect } from 'react';
import {
  Truck,
  BatteryCharging,
  Gauge,
  UserCheck,
  AlertOctagon,
  Send,
  X,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { Vehicle, Driver } from '../../types/logistics';

export function FleetDispatch() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('DRV-101');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('VH-REEFER-01');
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    LogisticsApi.listFleet().then((res) => {
      setVehicles(res.vehicles);
      setDrivers(res.drivers);
    });
  }, []);

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
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
            {vehicles.length} Units Online
          </span>
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

                {/* Payload Meter */}
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

                {/* Battery & Odometer */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-mono font-semibold text-foreground">
                      {v.fuel_battery_level_percent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                    <Gauge className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-foreground">{v.odometer_km.toLocaleString()} km</span>
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
    </div>
  );
}
