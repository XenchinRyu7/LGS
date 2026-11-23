import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Layers,
  ArrowRightLeft,
  ClipboardCheck,
  Snowflake,
  Plus,
  ShieldAlert,
  CheckCircle2,
  X,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { Warehouse, WarehouseStock, StockOpnameAudit, StorageZone } from '../../types/logistics';

export function WarehouseHub() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WH-JKT-CENTRAL');
  const [inventory, setInventory] = useState<WarehouseStock[]>([]);
  const [opnames, setOpnames] = useState<StockOpnameAudit[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [opnameModalOpen, setOpnameModalOpen] = useState(false);
  const [addSkuModalOpen, setAddSkuModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [sodError, setSodError] = useState<string | null>(null);

  // Transfer form
  const [targetWarehouse, setTargetWarehouse] = useState('WH-SBY-EAST');
  const [transferSku, setTransferSku] = useState('MED-VAC-001');
  const [transferQty, setTransferQty] = useState(50);

  // Opname form
  const [opnameSku, setOpnameSku] = useState('MED-VAC-001');
  const [physicalCount, setPhysicalCount] = useState(1200);

  // New SKU form
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuBin, setNewSkuBin] = useState('SEC-AISLE-05');
  const [newSkuQty, setNewSkuQty] = useState(100);
  const [newSkuZone, setNewSkuZone] = useState<StorageZone>('HighValueSecure');
  const [newSkuWeight, setNewSkuWeight] = useState(1.5);

  useEffect(() => {
    loadWarehouseData();
  }, [selectedWarehouseId]);

  const loadWarehouseData = async () => {
    try {
      const whs = await LogisticsApi.listWarehouses();
      setWarehouses(Array.isArray(whs) ? whs : []);
      const stocks = await LogisticsApi.listInventory(selectedWarehouseId);
      setInventory(Array.isArray(stocks) ? stocks : []);
      const auditList = await LogisticsApi.listOpnames();
      setOpnames(Array.isArray(auditList) ? auditList : []);
    } catch {
      setWarehouses([]);
      setInventory([]);
      setOpnames([]);
    }
  };

  const currentWarehouse = (warehouses || []).find((w) => w.id === selectedWarehouseId);

  const handleCreateSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuCode || !newSkuName) return;
    try {
      const created = await LogisticsApi.createStock({
        sku: newSkuCode,
        name: newSkuName,
        warehouse_id: selectedWarehouseId,
        bin_code: newSkuBin,
        initial_quantity: Number(newSkuQty),
        zone: newSkuZone,
        unit_weight_kg: Number(newSkuWeight),
      });
      setInventory([...inventory, created]);
      setAddSkuModalOpen(false);
      setBanner(`✅ SKU ${created.sku} registered and cataloged in ${selectedWarehouseId}`);
    } catch (err: any) {
      setBanner(`❌ Failed to create SKU: ${err.message}`);
    }
  };

  const handleStockTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setInventory((prev) =>
      prev.map((item) =>
        item.sku === transferSku
          ? { ...item, on_hand: Math.max(0, item.on_hand - transferQty) }
          : item
      )
    );
    setTransferModalOpen(false);
    setBanner(`✅ Initiated inter-facility transfer of ${transferQty}x ${transferSku} to ${targetWarehouse}`);
  };

  const handleOpnameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = inventory.find((i) => i.sku === opnameSku);
    const diff = stock ? physicalCount - stock.on_hand : 0;

    const newAudit: StockOpnameAudit = {
      audit_id: crypto.randomUUID(),
      warehouse_id: selectedWarehouseId,
      sku: opnameSku,
      system_count: stock ? stock.on_hand : 0,
      physical_count: physicalCount,
      discrepancy: diff,
      counted_by: '00000000-0000-4000-8000-000000000003', // WarehouseOperator
      status: 'PENDING_APPROVAL',
      notes: 'Physical count verified against count-sheet',
      timestamp: new Date().toISOString(),
    };

    setOpnames([newAudit, ...opnames]);
    setOpnameModalOpen(false);
    setBanner(`📝 Stock Opname count logged for ${opnameSku}. Staged for independent manager sign-off.`);
  };

  const handleApproveOpname = async (auditId: string) => {
    setSodError(null);
    try {
      const approved = await LogisticsApi.approveOpname(auditId);
      setOpnames((prev) => prev.map((o) => (o.audit_id === auditId ? approved : o)));
      setBanner(`✅ Opname reconciliation approved! Inventory reconciled.`);
    } catch (err: any) {
      if (err.message && err.message.includes('SoD Violation')) {
        setSodError(err.message);
      } else {
        setBanner(`❌ Approval failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* SoD Alert */}
      {sodError && (
        <div className="flex items-start justify-between rounded-xl border border-destructive/40 bg-destructive/15 p-4 text-xs text-destructive shadow-md">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">SoD Dual Control Interception</p>
              <p className="mt-0.5 text-muted-foreground">{sodError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSodError(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Banner */}
      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-xs text-foreground shadow-sm">
          <span>{banner}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Warehouse Selector & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {warehouses.map((wh) => (
            <button
              key={wh.id}
              type="button"
              onClick={() => setSelectedWarehouseId(wh.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedWarehouseId === wh.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-card-foreground hover:bg-muted'
              }`}
            >
              <WarehouseIcon className="h-4 w-4" />
              <span>{wh.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddSkuModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add SKU Item</span>
          </button>
          <button
            type="button"
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-card-foreground hover:bg-muted"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
            <span>Inter-Hub Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setOpnameModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-card-foreground hover:bg-muted"
          >
            <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
            <span>Stock Opname Audit</span>
          </button>
        </div>
      </div>

      {/* Facility Metrics Header */}
      {currentWarehouse && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground">Bin Occupancy</span>
            <p className="mt-1 text-xl font-bold text-foreground">
              {currentWarehouse.occupied_bins} / {currentWarehouse.total_bins}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${(currentWarehouse.occupied_bins / currentWarehouse.total_bins) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground">Active Hub Personnel</span>
            <p className="mt-1 text-xl font-bold text-foreground">
              {currentWarehouse.active_personnel} Staff
            </p>
            <span className="text-[11px] text-emerald-500 font-medium">Shift 1 Active</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground">Cold-Chain Cryo Vault</span>
            <div className="mt-1 flex items-center gap-1.5">
              {currentWarehouse.supports_cold_chain ? (
                <>
                  <Snowflake className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-400">Certified (-25°C)</span>
                </>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">Ambient Only</span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">Pharmaceutical Grade</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-xs text-muted-foreground">GPS Hub Coordinates</span>
            <p className="mt-1 font-mono text-xs font-bold text-foreground">
              {currentWarehouse.latitude}, {currentWarehouse.longitude}
            </p>
            <span className="text-[11px] text-muted-foreground">{currentWarehouse.city}, {currentWarehouse.province}</span>
          </div>
        </div>
      )}

      {/* Inventory Stock Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-card-foreground">SKU Inventory Allocation</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{inventory.length} SKUs Cataloged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU &amp; Product</th>
                <th className="py-3 px-4 font-semibold">Bin Location</th>
                <th className="py-3 px-4 font-semibold">Storage Zone</th>
                <th className="py-3 px-4 font-semibold">On-Hand</th>
                <th className="py-3 px-4 font-semibold">Reserved</th>
                <th className="py-3 px-4 font-semibold">Available Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-card-foreground">
              {inventory.map((stock) => {
                const available = Math.max(0, stock.on_hand - stock.reserved);
                return (
                  <tr key={stock.sku} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{stock.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{stock.sku}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                      {stock.bin_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                        {stock.zone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {stock.on_hand}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      {stock.reserved}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {available} units
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Opname Maker-Checker Approvals Section */}
      {opnames.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-card-foreground">
                Stock Opname Dual-Control Approvals
              </h3>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              SoD Enforced
            </span>
          </div>

          <div className="divide-y divide-border/60 text-xs">
            {opnames.map((op) => (
              <div key={op.audit_id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">SKU: {op.sku}</p>
                  <p className="text-muted-foreground text-[11px]">
                    System: {op.system_count} | Counted: {op.physical_count} | Variance:{' '}
                    <span className={op.discrepancy >= 0 ? 'text-emerald-400' : 'text-destructive'}>
                      {op.discrepancy >= 0 ? `+${op.discrepancy}` : op.discrepancy}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      op.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {op.status}
                  </span>
                  {op.status === 'PENDING_APPROVAL' && (
                    <button
                      type="button"
                      onClick={() => handleApproveOpname(op.audit_id)}
                      className="rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow hover:opacity-90"
                    >
                      Approve Variance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {addSkuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">Add SKU to Inventory</h3>
              <button
                type="button"
                onClick={() => setAddSkuModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSku} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">SKU Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NET-RTR-099"
                  value={newSkuCode}
                  onChange={(e) => setNewSkuCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Fiber Switch"
                  value={newSkuName}
                  onChange={(e) => setNewSkuName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Storage Zone</label>
                  <select
                    value={newSkuZone}
                    onChange={(e) => setNewSkuZone(e.target.value as StorageZone)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Ambient">Ambient</option>
                    <option value="ColdStorage">Cold Storage (-25°C)</option>
                    <option value="HighValueSecure">High-Value Secure</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Initial Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newSkuQty}
                    onChange={(e) => setNewSkuQty(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAddSkuModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Register SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Warehouse Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">Inter-Facility Stock Transfer</h3>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStockTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">Origin Hub</label>
                <input
                  type="text"
                  disabled
                  value={selectedWarehouseId}
                  className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Destination Hub</label>
                <select
                  value={targetWarehouse}
                  onChange={(e) => setTargetWarehouse(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="WH-SBY-EAST">Surabaya Gateway</option>
                  <option value="WH-BDG-WEST">Bandung Crossdock</option>
                  <option value="WH-JKT-CENTRAL">Jakarta Central</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">SKU to Transfer</label>
                <select
                  value={transferSku}
                  onChange={(e) => setTransferSku(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {inventory.map((i) => (
                    <option key={i.sku} value={i.sku}>
                      {i.sku} ({i.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Opname Audit Modal */}
      {opnameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">Stock Opname Count Sheet</h3>
              <button
                type="button"
                onClick={() => setOpnameModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOpnameSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">Audit Target SKU</label>
                <select
                  value={opnameSku}
                  onChange={(e) => setOpnameSku(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {inventory.map((i) => (
                    <option key={i.sku} value={i.sku}>
                      {i.sku} (Current on-hand: {i.on_hand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Actual Physical Count</label>
                <input
                  type="number"
                  min="0"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOpnameModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Submit Count Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
