import React, { useState } from 'react';
import {
  Activity,
  Package,
  Warehouse,
  Truck,
  Navigation,
  DollarSign,
} from 'lucide-react';
import { ControlTower } from './modules/ControlTower';
import { OrderManagement } from './modules/OrderManagement';
import { WarehouseHub } from './modules/WarehouseHub';
import { FleetDispatch } from './modules/FleetDispatch';
import { TrackingConsole } from './modules/TrackingConsole';
import { FinanceLedger } from './modules/FinanceLedger';

export type DashboardTab =
  | 'control-tower'
  | 'orders'
  | 'warehouses'
  | 'fleet'
  | 'tracking'
  | 'finance';

export function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('control-tower');

  const tabs = [
    { id: 'control-tower', label: 'Control Tower', icon: Activity },
    { id: 'orders', label: 'Orders & Fulfillment', icon: Package },
    { id: 'warehouses', label: 'Multi-Warehouse & Hubs', icon: Warehouse },
    { id: 'fleet', label: 'Fleet & Dispatch', icon: Truck },
    { id: 'tracking', label: 'Live Telemetry & Tracking', icon: Navigation },
    { id: 'finance', label: 'Finance & Tariffs', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Pills Bar */}
      <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Module Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'control-tower' && <ControlTower />}
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'warehouses' && <WarehouseHub />}
        {activeTab === 'fleet' && <FleetDispatch />}
        {activeTab === 'tracking' && <TrackingConsole />}
        {activeTab === 'finance' && <FinanceLedger />}
      </div>
    </div>
  );
}
