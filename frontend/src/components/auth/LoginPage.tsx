import React, { useState } from 'react';
import { Boxes, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, User, Briefcase, Building } from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { AuthUser, UserRole } from '../../types/logistics';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('alexander.hartono@elgs.ethereal.co.id');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('WarehouseOperator');
  const [department, setDepartment] = useState('Fulfillment Operations');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    switch (newRole) {
      case 'SuperAdmin':
        setDepartment('Enterprise Operations');
        break;
      case 'LogisticsManager':
        setDepartment('Fulfillment Management');
        break;
      case 'WarehouseOperator':
        setDepartment('Warehouse & Cryo Vault');
        break;
      case 'FleetDispatcher':
        setDepartment('Fleet Telematics');
        break;
      case 'FinanceAuditor':
        setDepartment('Treasury & Internal Audit');
        break;
      case 'Driver':
        setDepartment('Ground Operations');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@elgs.ethereal.co.id')) {
      setError('Work email domain must strictly be @elgs.ethereal.co.id');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await LogisticsApi.login({ email: cleanEmail, password });
        window.dispatchEvent(new CustomEvent('elgs:auth-changed', { detail: res.user }));
        onLoginSuccess(res.user);
      } else {
        if (!fullName.trim()) {
          setError('Full name is required for enterprise registration');
          setLoading(false);
          return;
        }
        const res = await LogisticsApi.register({
          email: cleanEmail,
          password,
          full_name: fullName.trim(),
          role,
          department,
        });
        window.dispatchEvent(new CustomEvent('elgs:auth-changed', { detail: res.user }));
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {mode === 'login' ? 'Sign In to ELGS' : 'Create ELGS Account'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ethereal Logistics Management System
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`rounded-lg py-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                if (email === 'alexander.hartono@elgs.ethereal.co.id') {
                  setEmail('');
                }
              }}
              className={`rounded-lg py-1.5 transition-all ${
                mode === 'register'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="reg-fullname" className="text-xs font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Raden Arya"
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-role" className="text-xs font-medium text-foreground">
                      Assigned Role
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <select
                        id="reg-role"
                        value={role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="WarehouseOperator">Warehouse Lead</option>
                        <option value="FleetDispatcher">Dispatcher</option>
                        <option value="LogisticsManager">Logistics Manager</option>
                        <option value="FinanceAuditor">Finance Auditor</option>
                        <option value="Driver">Driver</option>
                        <option value="SuperAdmin">Super Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-dept" className="text-xs font-medium text-foreground">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        id="reg-dept"
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-email" className="text-xs font-medium text-foreground">
                  Work Email Address
                </label>
                <span className="text-[10px] font-mono text-primary font-semibold">
                  @elgs.ethereal.co.id
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@elgs.ethereal.co.id"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-medium text-foreground">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer">
                  Remember this device
                </label>
              </div>
            )}

            <button
              type="submit"
              data-testid="auth-submit-btn"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Strict Domain Validation &bull; SoD Governance</span>
        </div>
      </div>
    </div>
  );
}
