import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle,
  Warehouse,
  DollarSign,
  ThermometerSnowflake,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { ExecutiveAnalyticsSummary, ThroughputPoint } from '../../types/logistics';

export function ControlTower() {
  const [metrics, setMetrics] = useState<ExecutiveAnalyticsSummary | null>(null);
  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LogisticsApi.getExecutiveOverview().then((res) => {
      setMetrics(res.metrics);
      setThroughput(res.throughput);
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Synchronizing telemetry stream...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Today's Orders",
      value: metrics.total_orders_today.toLocaleString(),
      sub: '+14.2% vs yesterday',
      icon: Package,
      positive: true,
    },
    {
      title: 'Active In-Transit',
      value: metrics.active_shipments_in_transit.toString(),
      sub: 'All telemetry nominal',
      icon: Truck,
      positive: true,
    },
    {
      title: 'On-Time Delivery (OTD)',
      value: `${metrics.on_time_delivery_rate_percent}%`,
      sub: 'Exceeding 98% SLA target',
      icon: CheckCircle,
      positive: true,
    },
    {
      title: 'Fleet Utilization',
      value: `${metrics.fleet_utilization_percent}%`,
      sub: '3 vehicles active in field',
      icon: TrendingUp,
      positive: true,
    },
    {
      title: 'Warehouse Utilization',
      value: `${metrics.warehouse_utilization_percent}%`,
      sub: 'Capacity across 3 hubs',
      icon: Warehouse,
      positive: true,
    },
    {
      title: 'Revenue Generated',
      value: `Rp ${(metrics.total_revenue_today / 1_000_000).toFixed(1)}M`,
      sub: '+8.6% week-on-week',
      icon: DollarSign,
      positive: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-card-foreground">
              Executive Telemetry &amp; Control Tower
            </h2>
            <p className="text-xs text-muted-foreground">
              Autonomous orchestration of Jakarta Central, Surabaya Gateway, and Bandung hubs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            All Facilities Nominal
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black tracking-tight text-card-foreground">
                  {kpi.value}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{kpi.sub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Throughput SVG Chart & Cold Chain Compliance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-time Order Throughput Curve */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Fulfillment Throughput</h3>
              <p className="text-xs text-muted-foreground">Hourly orders dispatched vs delivered</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Dispatched
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Delivered
              </span>
            </div>
          </div>

          {/* SVG Visualizer */}
          <div className="mt-6 h-56 w-full">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 700 200">
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="0" y1="180" x2="700" y2="180" stroke="var(--border)" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="var(--border)" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="700" y2="60" stroke="var(--border)" strokeDasharray="3 3" />

              {/* Fill Area */}
              <path
                d="M 50 180 L 50 160 L 150 130 L 250 90 L 350 70 L 450 45 L 550 30 L 650 15 L 650 180 Z"
                fill="url(#throughputGrad)"
              />

              {/* Line 1 - Primary Dispatched */}
              <path
                d="M 50 160 L 150 130 L 250 90 L 350 70 L 450 45 L 550 30 L 650 15"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Line 2 - Secondary Delivered */}
              <path
                d="M 50 170 L 150 150 L 250 120 L 350 100 L 450 75 L 550 50 L 650 30"
                fill="none"
                stroke="var(--muted-foreground)"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              {/* Points & Labels */}
              {throughput.map((pt, i) => {
                const x = 50 + i * 100;
                return (
                  <g key={i}>
                    <circle cx={x} cy={160 - i * 24} r="4" fill="var(--primary)" />
                    <text
                      x={x}
                      y="196"
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Cold Chain & Facility Telemetry Block */}
        <div className="space-y-4">
          {/* Cold Chain Sentinel Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-card-foreground">
                  Cryo-Vault Sentinel (-20°C)
                </span>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                LOCKED
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target Range</span>
                <span className="font-mono font-semibold text-foreground">-25.0°C to -15.0°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Average</span>
                <span className="font-mono font-bold text-cyan-400">-20.4°C (Nominal)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Breach Violations</span>
                <span className="font-mono font-semibold text-emerald-500">0 Events Today</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Cycle Speed */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-card-foreground">Order-to-Dispatch</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary">3.4 hrs avg</span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Picking wave speed</span>
                <span>94% optimal</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: '94%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
