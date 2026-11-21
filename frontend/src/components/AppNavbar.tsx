import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu,
  UserCheck,
  Database,
  X,
  LogOut,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LogisticsApi } from '../lib/api';
import type { AuthUser, UserRole } from '../types/logistics';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}

export function AppNavbar() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Cryo-Vault Compliance Verified',
      message: 'WH-JKT-CENTRAL vaccine zone operating at nominal -20.2°C.',
      type: 'success',
      time: '2m ago',
      read: false,
    },
    {
      id: '2',
      title: 'SoD Boundary Guard Active',
      message: 'Dual-control maker-checker rules active for sales orders & opname reconciliations.',
      type: 'info',
      time: '10m ago',
      read: false,
    },
    {
      id: '3',
      title: 'Stock Opname Pending Sign-Off',
      message: 'Variance of +50 units on MED-VAC-001 waiting for independent manager review.',
      type: 'warning',
      time: '25m ago',
      read: false,
    },
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const stored = LogisticsApi.getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    } else {
      LogisticsApi.getCurrentUser().then((data) => {
        setCurrentUser(data.user);
      });
    }

    const handleAuthChanged = (e: any) => {
      setCurrentUser(e.detail || null);
    };
    window.addEventListener('elgs:auth-changed', handleAuthChanged);
    return () => window.removeEventListener('elgs:auth-changed', handleAuthChanged);
  }, []);

  const handleRoleChange = async (role: UserRole) => {
    const res = await LogisticsApi.switchRole(role);
    setCurrentUser(res.user);
    window.dispatchEvent(new CustomEvent('elgs:role-changed', { detail: res.user }));
  };

  const handleLogout = async () => {
    await LogisticsApi.logout();
    setCurrentUser(null);
    window.dispatchEvent(new CustomEvent('elgs:auth-changed', { detail: null }));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
                ELGS<span className="text-primary font-normal text-xs ml-1.5 hidden sm:inline">&bull; Ethereal Logistics Management System</span>
              </span>
              <span className="rounded-md bg-primary/15 border border-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary tracking-wider">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Enterprise Logistics Engine
            </p>
          </div>
        </div>

        {/* Status, RBAC Switcher, Theme Switcher & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Supabase & Upstash DB Monitor Pill */}
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 transition-colors"
            title="Database & Redis Layer Status"
          >
            <Database className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">Supabase &bull; Upstash</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Active RBAC Role Switcher & Sign Out */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <label htmlFor="rbac-role-select" className="sr-only">Active RBAC Role</label>
                <select
                  id="rbac-role-select"
                  value={currentUser.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  title="Switch session persona to test SoD maker-checker boundaries"
                >
                  <option value="SuperAdmin" className="bg-card text-card-foreground">Alexander H. (SuperAdmin)</option>
                  <option value="LogisticsManager" className="bg-card text-card-foreground">Diana P. (LogisticsManager)</option>
                  <option value="WarehouseOperator" className="bg-card text-card-foreground">Farhan M. (WarehouseOperator)</option>
                  <option value="FleetDispatcher" className="bg-card text-card-foreground">Satria W. (FleetDispatcher)</option>
                  <option value="FinanceAuditor" className="bg-card text-card-foreground">Evelyn W. (FinanceAuditor)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                title="Sign out of ELGS"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('elgs:auth-changed', { detail: null }));
              }}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
            >
              Sign In
            </button>
          )}

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Notification Center */}
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
                      Operational &amp; SoD Feeds
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
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
                        <Cpu className="h-4 w-4 text-primary shrink-0 mt-0.5" />
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Database & Redis Topology Dialog */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-card-foreground">
                  Cloud Infrastructure Topology
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Supabase PostgreSQL 15+</span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-bold text-emerald-400">
                    Schema Ready (0001_init)
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Stores persistent ACID transactions, IAM users, role permissions, sales orders, inventory, and SOC-2 immutable audit trails.
                </p>
                <code className="block rounded bg-background p-2 font-mono text-[11px] text-primary break-all">
                  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
                </code>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Upstash Redis &amp; Locks</span>
                  <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 font-bold text-cyan-400">
                    Configured
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Manages high-throughput distributed locks for atomic stock reservation, real-time GPS telemetry feeds, and fast session tokens.
                </p>
                <code className="block rounded bg-background p-2 font-mono text-[11px] text-cyan-400 break-all">
                  UPSTASH_REDIS_REST_URL=https://[INSTANCE].upstash.io
                </code>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
              >
                Close Topology
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
