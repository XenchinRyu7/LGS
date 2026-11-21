import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  Activity,
  Package,
  Warehouse,
  Truck,
  Navigation,
  DollarSign,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  Database,
  LogOut,
  UserCheck,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { ControlTower } from './modules/ControlTower';
import { OrderManagement } from './modules/OrderManagement';
import { WarehouseHub } from './modules/WarehouseHub';
import { FleetDispatch } from './modules/FleetDispatch';
import { TrackingConsole } from './modules/TrackingConsole';
import { FinanceLedger } from './modules/FinanceLedger';
import { AuditTrailConsole } from './modules/AuditTrailConsole';
import { LoginPage } from './auth/LoginPage';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LogisticsApi } from '../lib/api';
import type { AuthUser, UserRole } from '../types/logistics';

export type DashboardTab =
  | 'control-tower'
  | 'orders'
  | 'warehouses'
  | 'fleet'
  | 'tracking'
  | 'finance'
  | 'audit-trail';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}

export function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('control-tower');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return LogisticsApi.getStoredUser();
  });

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Cryo-Vault Nominal',
      message: 'WH-JKT-CENTRAL vaccine zone operating at -20.2°C.',
      type: 'success',
      time: '2m ago',
      read: false,
    },
    {
      id: '2',
      title: 'SoD Guard Active',
      message: 'Dual-control maker-checker rules active for orders & opname.',
      type: 'info',
      time: '10m ago',
      read: false,
    },
    {
      id: '3',
      title: 'Stock Opname Pending Review',
      message: 'Variance of +50 units on MED-VAC-001 waiting for checker approval.',
      type: 'warning',
      time: '25m ago',
      read: false,
    },
  ]);

  useEffect(() => {
    if (!currentUser) {
      LogisticsApi.getCurrentUser().then((data) => {
        setCurrentUser(data.user);
      });
    }

    const handleAuthChanged = (e: any) => {
      setCurrentUser(e.detail || null);
    };
    const handleRoleChanged = (e: any) => {
      if (e.detail) setCurrentUser(e.detail);
    };

    window.addEventListener('elgs:auth-changed', handleAuthChanged);
    window.addEventListener('elgs:role-changed', handleRoleChanged);

    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('elgs:auth-changed', handleAuthChanged);
      window.removeEventListener('elgs:role-changed', handleRoleChanged);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUser]);

  const handleRoleChange = async (role: UserRole) => {
    const res = await LogisticsApi.switchRole(role);
    setCurrentUser(res.user);
    setProfileDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('elgs:role-changed', { detail: res.user }));
  };

  const handleLogout = async () => {
    await LogisticsApi.logout();
    setCurrentUser(null);
    setProfileDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('elgs:auth-changed', { detail: null }));
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navGroups = [
    {
      group: 'OPERATIONS',
      items: [
        { id: 'control-tower', label: 'Overview', icon: Activity },
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
        { id: 'fleet', label: 'Fleet & Dispatch', icon: Truck },
        { id: 'tracking', label: 'Tracking', icon: Navigation },
      ],
    },
    {
      group: 'GOVERNANCE',
      items: [
        { id: 'finance', label: 'Invoices & Billing', icon: DollarSign },
        { id: 'audit-trail', label: 'Audit Logs', icon: ShieldCheck },
      ],
    },
  ];

  const currentTabLabel =
    navGroups
      .flatMap((g) => g.items)
      .find((item) => item.id === activeTab)?.label || 'Overview';

  const userInitials = currentUser.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-200 lg:static ${
          sidebarCollapsed ? 'w-18' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Boxes className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground">ELGS</span>
                <span className="text-[10px] text-muted-foreground">Logistics Management</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              {!sidebarCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground">
                  {group.group}
                </div>
              ) : (
                <div className="h-1 mx-2 my-2 border-t border-border/60" />
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as DashboardTab);
                      setMobileMenuOpen(false);
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Status */}
        <div className="p-3 border-t border-border">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Operational</span>
              </div>
              <span className="font-mono text-[10px]">v2.4</span>
            </div>
          ) : (
            <div className="flex justify-center py-1" title="Operational v2.4">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT WRAPPER ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP NAVBAR / HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground">ELGS</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="font-semibold text-foreground">{currentTabLabel}</span>
            </div>
          </div>

          {/* Right: Search, Database, Theme, Notifications, Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Database Status Button */}
            <button
              type="button"
              onClick={() => setDbModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 transition-colors"
              title="Database & Redis Topology"
            >
              <Database className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">Supabase &bull; Upstash</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-xl z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">Notifications</span>
                    <button
                      type="button"
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="divide-y divide-border/60 max-h-60 overflow-y-auto my-2">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`py-2 px-1 flex items-start gap-2.5 text-xs ${
                          item.read ? 'opacity-60' : ''
                        }`}
                      >
                        {item.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />}
                        {item.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />}
                        {item.type === 'info' && <Radio className="h-4 w-4 text-primary mt-0.5" />}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground">{item.message}</p>
                          <span className="text-[10px] text-muted-foreground/80">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── REAL PROFILE DROPDOWN ─── */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 pr-2.5 hover:border-primary/50 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {currentUser.full_name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 space-y-3">
                  {/* User Profile Header */}
                  <div className="pb-2 border-b border-border">
                    <div className="font-semibold text-xs text-foreground">{currentUser.full_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{currentUser.email}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <UserCheck className="h-3 w-3" />
                      <span>{currentUser.role}</span>
                    </div>
                  </div>

                  {/* Switch Persona Submenu */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                      Switch Persona
                    </div>
                    {(
                      [
                        { role: 'SuperAdmin', label: 'Alexander H. (SuperAdmin)' },
                        { role: 'LogisticsManager', label: 'Diana P. (LogisticsManager)' },
                        { role: 'WarehouseOperator', label: 'Farhan M. (WarehouseLead)' },
                        { role: 'FleetDispatcher', label: 'Satria W. (FleetDispatcher)' },
                        { role: 'FinanceAuditor', label: 'Evelyn W. (FinanceAuditor)' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.role}
                        type="button"
                        onClick={() => handleRoleChange(p.role)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                          currentUser.role === p.role
                            ? 'bg-primary/15 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>{p.label}</span>
                        {currentUser.role === p.role && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>

                  {/* Sign Out */}
                  <div className="pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-150">
            {activeTab === 'control-tower' && <ControlTower />}
            {activeTab === 'orders' && <OrderManagement />}
            {activeTab === 'warehouses' && <WarehouseHub />}
            {activeTab === 'fleet' && <FleetDispatch />}
            {activeTab === 'tracking' && <TrackingConsole />}
            {activeTab === 'finance' && <FinanceLedger />}
            {activeTab === 'audit-trail' && <AuditTrailConsole />}
          </div>
        </main>
      </div>

      {/* Supabase & Upstash Topology Modal */}
      {dbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Database className="h-4 w-4 text-primary" />
                <span>Database &amp; Redis Topology</span>
              </div>
              <button
                type="button"
                onClick={() => setDbModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border bg-background p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Supabase PostgreSQL</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Pooler Ready
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Port 6543 pooler with 9 relational tables, foreign key constraints, and SoD boundary enforcement.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Upstash Redis</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Serverless Redis caching telemetry streams and distributed lock reservations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDbModalOpen(false)}
              className="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
