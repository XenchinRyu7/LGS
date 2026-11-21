import React, { useState, useEffect } from 'react';
import {
  Search,
  Navigation,
  CheckCircle2,
  ThermometerSnowflake,
  Radio,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { TrackingView } from '../../types/logistics';

export function TrackingConsole() {
  const [trackingNumber, setTrackingNumber] = useState('TRK-ALPHA01');
  const [trackingData, setTrackingData] = useState<TrackingView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracking(trackingNumber);
  }, []);

  const fetchTracking = async (trk: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LogisticsApi.getTracking(trk.trim());
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'Tracking number not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber) fetchTracking(trackingNumber);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="max-w-xl space-y-2">
          <h3 className="text-base font-bold text-card-foreground">
            Live Telemetry &amp; GPS Breadcrumb Tracker
          </h3>
          <p className="text-xs text-muted-foreground">
            Real-time tracking of active shipments with continuous cold-vault logger telemetry.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter tracking number (e.g. TRK-ALPHA01)..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition-opacity"
            >
              <Navigation className="h-4 w-4" />
              <span>Track</span>
            </button>
          </form>

          {/* Quick preset links */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <span>Quick Samples:</span>
            {['TRK-ALPHA01', 'TRK-BETA02', 'TRK-GAMMA03'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setTrackingNumber(sample);
                  fetchTracking(sample);
                }}
                className="font-mono text-primary hover:underline"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          {error}
        </div>
      )}

      {trackingData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracking Timeline */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground">WAYBILL</span>
                <h4 className="text-base font-bold text-card-foreground">
                  {trackingData.tracking_number}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Order Ref: {trackingData.order_number} &bull; Destination: {trackingData.destination_city}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  {trackingData.current_status}
                </span>
              </div>
            </div>

            {/* Timeline Events */}
            <div className="space-y-6 pl-4 border-l-2 border-border relative">
              {trackingData.events.map((ev, idx) => (
                <div key={ev.event_id} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{ev.status} &mdash; {ev.location_name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Simulated Telemetry Stream */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-card-foreground">Live Telemetry Ping</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">100% Signal</span>
              </div>

              {trackingData.live_telemetry ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned Carrier</span>
                    <span className="font-semibold text-foreground">
                      {trackingData.live_telemetry.vehicle_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Driver</span>
                    <span className="font-semibold text-foreground">
                      {trackingData.live_telemetry.driver_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current GPS Coordinates</span>
                    <span className="font-mono text-primary font-bold">
                      {trackingData.live_telemetry.latitude}, {trackingData.live_telemetry.longitude}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ground Speed</span>
                    <span className="font-mono text-foreground font-semibold">
                      {trackingData.live_telemetry.speed_kmh} km/h
                    </span>
                  </div>

                  {trackingData.live_telemetry.temperature_celsius !== undefined && (
                    <div className="flex items-center justify-between rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
                      <div className="flex items-center gap-1.5">
                        <ThermometerSnowflake className="h-4 w-4" />
                        <span className="font-semibold">Cryo-Sensor</span>
                      </div>
                      <span className="font-mono font-bold">
                        {trackingData.live_telemetry.temperature_celsius}°C
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Dynamic ETA</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ~{trackingData.live_telemetry.eta_minutes} mins remaining
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Shipment is completed or staged at warehouse dock.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
