import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Database,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { AuditRecord } from '../../types/logistics';

export function AuditTrailConsole() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoading(true);
    const data = await LogisticsApi.listAuditTrail();
    setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action.includes(filterAction);
    const matchesSearch =
      log.actor_name.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_id.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.hash_signature.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const sodViolations = logs.filter((l) => l.action.includes('SOD_VIOLATION'));

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-card-foreground">
                SOC-2 &amp; SoD Tamper-Evident Audit Trail
              </h2>
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                NON-REPUDIATION HASHED
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Immutable ledger tracking all state mutations, Maker-Checker enforcements, and SoD boundary violations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAudit}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* SoD Violation Callout if any */}
      {sodViolations.length > 0 && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-destructive font-bold">
            <ShieldAlert className="h-4 w-4" />
            <span>SoD Boundary Enforcements Triggered ({sodViolations.length} Events)</span>
          </div>
          <p className="text-muted-foreground">
            The system successfully intercepted and blocked unauthorized dual-control actions (e.g. Maker attempting to approve own order or variance reconciliation without independent checker).
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by actor, resource ID, action, hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <label htmlFor="filter-audit-action" className="sr-only">Filter Audit Action</label>
          <select
            id="filter-audit-action"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="ORDER">Orders Events</option>
            <option value="SOD_VIOLATION">SoD Blocked Violations</option>
            <option value="STOCK">Warehouse &amp; Stock Events</option>
            <option value="INVOICE">Invoicing &amp; Treasury</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp &amp; IP</th>
                <th className="py-3 px-4 font-semibold">Actor &amp; RBAC Role</th>
                <th className="py-3 px-4 font-semibold">Action &amp; Resource</th>
                <th className="py-3 px-4 font-semibold">Audit State Transition Details</th>
                <th className="py-3 px-4 font-semibold font-mono">SHA Hash Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-card-foreground">
              {filteredLogs.map((log) => {
                const isViolation = log.action.includes('SOD_VIOLATION');
                return (
                  <tr
                    key={log.audit_id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isViolation ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-foreground font-semibold">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">{log.ip_address}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{log.actor_name}</p>
                      <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {log.actor_role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isViolation
                            ? 'bg-destructive/20 text-destructive border border-destructive/40'
                            : 'bg-primary/15 text-primary border border-primary/30'
                        }`}
                      >
                        {log.action}
                      </span>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {log.resource_type}: {log.resource_id}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      {log.after_state && (
                        <p className="text-[11px] text-foreground font-medium">{log.after_state}</p>
                      )}
                      {log.before_state && (
                        <p className="text-[10px] text-muted-foreground">Before: {log.before_state}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[10px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">{log.hash_signature}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
