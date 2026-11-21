import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Layers,
  ArrowRightLeft,
  ClipboardCheck,
  Snowflake,
  X,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { Warehouse, WarehouseStock } from '../../types/logistics';

export function WarehouseHub() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WH-JKT-CENTRAL');
  const [inventory, setInventory] = useState<WarehouseStock[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [opnameModalOpen, setOpnameModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // Transfer form state
  const [targetWarehouse, setTargetWarehouse] = useState('WH-SBY-EAST');
  const [transferSku, setTransferSku] = useState('MED-VAC-001');
  const [transferQty, setTransferQty] = useState(50);

  // Opname form state
  const [opnameSku, setOpnameSku] = useState('MED-VAC-001');
  const [physicalCount, setPhysicalCount] = useState(1200);

  useEffect(() => {
    loadWarehouseData();
  }, [selectedWarehouseId]);

  const loadWarehouseData = async () => {
    const whs = await LogisticsApi.listWarehouses();
    setWarehouses(whs);
    const stocks = await LogisticsApi.listInventory(selectedWarehouseId);
    setInventory(stocks);
  };

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

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

  const handleOpnameAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = inventory.find((i) => i.sku === opnameSku);
    const diff = stock ? physicalCount - stock.on_hand : 0;
    setInventory((prev) =>
      prev.map((item) =>
        item.sku === opnameSku ? { ...item, on_hand: physicalCount } : item
      )
    );
    setOpnameModalOpen(false);
    setBanner(
      `✅ Stock Opname logged for ${opnameSku}. System reconciled: ${diff >= 0 ? `+${diff}` : diff} units.`
    );
  };

  return (
    <div className="space-y-6">
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
        {/* Tabs for warehouses */}
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

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
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

      {/* Warehouse Kanban Waves: Picking & Packing Waves */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-card-foreground">Fulfillment Waves Workflow</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wave 1: Picking */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground">Picking Wave Queue</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">2 Batches</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
              <span className="font-mono font-bold text-primary">BATCH-JKT-09</span>
              <p className="text-foreground font-medium">150x MED-VAC-001 (Cold Vault)</p>
              <p className="text-[10px] text-muted-foreground">Assigned to: Operator Farhan</p>
            </div>
          </div>

          {/* Wave 2: Packing */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground">Packing &amp; Dry-Ice Logging</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">1 Batch</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
              <span className="font-mono font-bold text-amber-400">PACK-STATION-03</span>
              <p className="text-foreground font-medium">20x ELEC-SRV-042 (Shock-Proof Pack)</p>
              <p className="text-[10px] text-muted-foreground">Thermal logger attached</p>
            </div>
          </div>

          {/* Wave 3: Staging for Fleet */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground">Dispatch Dock Staging</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">Ready</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
              <span className="font-mono font-bold text-emerald-400">DOCK-BAY-04</span>
              <p className="text-foreground font-medium">Reefer Truck VH-REEFER-01</p>
              <p className="text-[10px] text-muted-foreground">Pre-cooled to -20°C verified</p>
            </div>
          </div>
        </div>
      </div>

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
              <h3 className="text-base font-bold text-card-foreground">Stock Opname Audit</h3>
              <button
                type="button"
                onClick={() => setOpnameModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOpnameAudit} className="space-y-4 text-xs">
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
                  Reconcile &amp; Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
