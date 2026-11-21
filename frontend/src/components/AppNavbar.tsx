import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Activity,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LogisticsApi } from '../lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}

export function AppNavbar() {
  const [backendStatus, setBackendStatus] = useState<'connected' | 'checking' | 'fallback'>('checking');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Cold Vault Compliance -20.2°C',
      message: 'WH-JKT-CENTRAL vaccine zone operating in nominal cryo range.',
      type: 'success',
      time: '4m ago',
      read: false,
    },
    {
      id: '2',
      title: 'Fleet Dispatch Notice',
      message: 'Reefer Truck VH-REEFER-01 dispatched to Rasuna Said corridor.',
      type: 'info',
      time: '12m ago',
      read: false,
    },
    {
      id: '3',
      title: 'Express Order Created',
      message: 'Telkom Data Infrastructure requested 20x Edge Servers.',
      type: 'warning',
      time: '28m ago',
      read: false,
    },
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    LogisticsApi.getHealth()
      .then((res) => {
        if (res.status === 'healthy') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('fallback');
        }
      })
      .catch(() => setBackendStatus('fallback'));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-foreground">
                Nexus<span className="text-primary">Logistics</span>
              </span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Enterprise v2.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Distributed Logistics Management &amp; Cryo-Telemetry Engine
            </p>
          </div>
        </div>

        {/* Status, Theme Switcher & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Backend Status Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground font-medium">Rust Engine:</span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              {backendStatus === 'connected' ? 'Axum Online' : 'Active (Local)'}
            </span>
          </div>

          {/* Theme Switcher Component */}
          <ThemeSwitcher />

          {/* Notification Center Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-card-foreground hover:bg-muted transition-colors"
              aria-label="Toggle notifications"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs font-bold text-card-foreground">
                      Telemetry &amp; Ops Feeds
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-border/60 max-h-72 overflow-y-auto my-2">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`py-2.5 px-2 flex items-start gap-2.5 transition-colors rounded-lg ${
                        item.read ? 'opacity-70' : 'bg-muted/40'
                      }`}
                    >
                      {item.type === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      {item.type === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      {item.type === 'info' && (
                        <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <span className="text-[10px] text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border text-center">
                  <span className="text-[10px] text-muted-foreground">
                    Telemetry connected to Axum backend event bus
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
