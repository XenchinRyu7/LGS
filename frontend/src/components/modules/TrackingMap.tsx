import React, { useEffect, useRef, useState } from 'react';
import type { TrackingView } from '../../types/logistics';
import {
  Navigation,
  Crosshair,
  Maximize2,
  ThermometerSnowflake,
  Gauge,
  Radio,
  MapPin,
  Warehouse,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  trackingData: TrackingView;
}

// Simulated GPS path from Cikarang Hub to Bandung Distribution Center
const ROUTE_COORDINATES: [number, number][] = [
  [-6.3248, 107.1528], // Origin: Cikarang Central Hub
  [-6.4124, 107.2415], // Karawang Timur Waypoint
  [-6.5312, 107.4112], // Purwakarta Toll Road Waypoint
  [-6.7214, 107.4988], // Cipularang KM 92
  [-6.8521, 107.5642], // Padalarang Interchange
  [-6.9175, 107.6191], // Destination: Bandung Regional Depot
];

export function TrackingMap({ trackingData }: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const initialLat = trackingData.live_telemetry?.latitude ?? ROUTE_COORDINATES[2][0];
  const initialLng = trackingData.live_telemetry?.longitude ?? ROUTE_COORDINATES[2][1];

  const [currentCoord, setCurrentCoord] = useState<[number, number]>([initialLat, initialLng]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(trackingData.live_telemetry?.speed_kmh ?? 68);
  const [currentTemp, setCurrentTemp] = useState<number>(
    trackingData.live_telemetry?.temperature_celsius ?? -20.4
  );
  const [waypointIndex, setWaypointIndex] = useState(2);
  const [isSimulating, setIsSimulating] = useState(true);

  // Initialize Leaflet Map safely in client-side useEffect
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = await import('leaflet');

      // Initialize Map
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 10,
        zoomControl: false,
      });

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tile Layer (100% Free & Open Source)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom Origin Warehouse Icon
      const warehouseIcon = L.divIcon({
        className: 'custom-warehouse-pin',
        html: `
          <div style="background: #3b82f6; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); border: 2px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Custom Destination Icon
      const destinationIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="background: #10b981; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); border: 2px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      // Custom Vehicle Pulse Marker
      const vehicleIcon = L.divIcon({
        className: 'custom-vehicle-pin',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: rgba(99, 102, 241, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background: #4f46e5; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.6); border: 2px solid #ffffff;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Place Origin Marker
      const originCoord = ROUTE_COORDINATES[0];
      L.marker(originCoord, { icon: warehouseIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <b style="color: #1e3a8a;">Origin Facility</b><br/>
            Cikarang Distribution Hub (WH-CKR-01)<br/>
            <span style="color: #64748b;">Dispatched &bull; Verified</span>
          </div>`
        );

      // Place Destination Marker
      const destCoord = ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1];
      L.marker(destCoord, { icon: destinationIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <b style="color: #065f46;">Destination Depot</b><br/>
            ${trackingData.destination_city || 'Bandung Regional Center'}<br/>
            <span style="color: #64748b;">ETA: ~${trackingData.live_telemetry?.eta_minutes || 42} mins</span>
          </div>`
        );

      // Draw Route Polyline
      const polyline = L.polyline(ROUTE_COORDINATES, {
        color: '#4f46e5',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
      polylineRef.current = polyline;

      // Place Vehicle Marker
      const vehicleMarker = L.marker([initialLat, initialLng], { icon: vehicleIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <b style="color: #4338ca;">Vehicle: ${trackingData.live_telemetry?.vehicle_id || 'B-9142-TXR'}</b><br/>
            Driver: ${trackingData.live_telemetry?.driver_name || 'Agus Supriatna'}<br/>
            Speed: <b style="color: #059669;">${currentSpeed} km/h</b><br/>
            Cryo-Vault: <b style="color: #0284c7;">${currentTemp}°C</b>
          </div>`
        );

      vehicleMarkerRef.current = vehicleMarker;
      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Real-time animated GPS breadcrumb progression along polyline
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setWaypointIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % ROUTE_COORDINATES.length;
        const target = ROUTE_COORDINATES[nextIdx];

        // Random jitter for realistic micro-telemetry
        const jitterLat = target[0] + (Math.random() - 0.5) * 0.005;
        const jitterLng = target[1] + (Math.random() - 0.5) * 0.005;
        const newCoord: [number, number] = [jitterLat, jitterLng];

        const speedJitter = 60 + Math.floor(Math.random() * 15);
        const tempJitter = -20.0 + Number(((Math.random() - 0.5) * 0.8).toFixed(1));

        setCurrentCoord(newCoord);
        setCurrentSpeed(speedJitter);
        setCurrentTemp(tempJitter);

        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLatLng(newCoord);
          vehicleMarkerRef.current.setPopupContent(
            `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <b style="color: #4338ca;">Vehicle: ${trackingData.live_telemetry?.vehicle_id || 'B-9142-TXR'}</b><br/>
              Driver: ${trackingData.live_telemetry?.driver_name || 'Agus Supriatna'}<br/>
              Speed: <b style="color: #059669;">${speedJitter} km/h</b><br/>
              Cryo-Vault: <b style="color: #0284c7;">${tempJitter}°C</b>
            </div>`
          );
        }

        return nextIdx;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating, trackingData]);

  // Center on vehicle
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentCoord, 12, { animate: true });
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.openPopup();
      }
    }
  };

  // Fit entire delivery route bounds
  const handleFitRoute = () => {
    if (mapInstanceRef.current && polylineRef.current) {
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), {
        padding: [40, 40],
        animate: true,
      });
    }
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Map Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/40 border-b border-border gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Navigation className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              <span>OpenStreetMap Live GPS Tracking</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                <Radio className="h-3 w-3 animate-pulse" /> Live Telemetry
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Waypoint tracking via OpenStreetMap &bull; High precision IoT gateway
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRecenter}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Recenter Map on Carrier"
          >
            <Crosshair className="h-3.5 w-3.5 text-primary" />
            <span>Center Vehicle</span>
          </button>

          <button
            type="button"
            onClick={handleFitRoute}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Fit Entire Transit Corridor"
          >
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Fit Route</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all shadow-xs ${
              isSimulating
                ? 'bg-emerald-500 text-white'
                : 'border border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isSimulating ? 'bg-white animate-ping' : 'bg-muted-foreground'}`} />
            <span>{isSimulating ? 'Live Sim ON' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative h-[380px] w-full bg-muted/20">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Real-time Telemetry Overlay HUD */}
        <div className="absolute bottom-4 left-4 z-1000 flex flex-wrap gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md px-3 py-1.5 text-xs shadow-md">
            <Gauge className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Speed</div>
              <div className="font-mono font-bold text-foreground">{currentSpeed} km/h</div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-background/95 backdrop-blur-md px-3 py-1.5 text-xs shadow-md text-cyan-500">
            <ThermometerSnowflake className="h-4 w-4" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Cold Chain</div>
              <div className="font-mono font-bold">{currentTemp}°C</div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md px-3 py-1.5 text-xs shadow-md">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Coordinates</div>
              <div className="font-mono text-[11px] text-foreground">
                {currentCoord[0].toFixed(4)}, {currentCoord[1].toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-1000 hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-background/90 backdrop-blur-md px-3 py-1.5 text-[11px] shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Hub Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-semibold text-foreground">Live Carrier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Destination Depot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
