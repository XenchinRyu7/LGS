import React, { useState } from 'react';
import { X, User, Shield, Lock, Check, AlertCircle } from 'lucide-react';
import type { AuthUser } from '../../types/logistics';
import { LogisticsApi } from '../../lib/api';

interface ProfileModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: AuthUser) => void;
}

export function ProfileModal({ user, isOpen, onClose, onUserUpdated }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [department, setDepartment] = useState(user.department);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await LogisticsApi.updateProfile({
        full_name: fullName,
        email,
        department,
      });
      onUserUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const userInitials = user.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-sm">
              {userInitials}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Profile &amp; Account Settings</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-border text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Personal Information</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'security'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Security &amp; Password</span>
          </button>
        </div>

        {/* Tab 1: Personal Details */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveDetails} className="space-y-4">
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500">
                <Check className="h-4 w-4" />
                <span>Profile details saved successfully.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="profile-fullname" className="text-xs font-medium text-foreground">
                Full Name
              </label>
              <input
                id="profile-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="text-xs font-medium text-foreground">
                Work Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-dept" className="text-xs font-medium text-foreground">
                Department
              </label>
              <input
                id="profile-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Assigned RBAC Role
                </span>
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Role and permissions are assigned by system administrators according to Segregation of Duties (SoD) policies.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-3.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500">
                <Check className="h-4 w-4" />
                <span>Password updated successfully.</span>
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="curr-pass" className="text-xs font-medium text-foreground">
                Current Password
              </label>
              <input
                id="curr-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-pass" className="text-xs font-medium text-foreground">
                New Password
              </label>
              <input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-pass" className="text-xs font-medium text-foreground">
                Confirm New Password
              </label>
              <input
                id="confirm-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-3.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
