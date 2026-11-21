import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  X,
  Edit3,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type { SalesOrder, OrderStatus, ServiceTier } from '../../types/logistics';

export function OrderManagement() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sodAlert, setSodAlert] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // New order form
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newServiceTier, setNewServiceTier] = useState<ServiceTier>('Standard');
  const [newOriginWarehouse, setNewOriginWarehouse] = useState('WH-JKT-CENTRAL');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newCity, setNewCity] = useState('Jakarta');
  const [newAddress, setNewAddress] = useState('');
  const [newSku, setNewSku] = useState('MED-VAC-001');
  const [newQty, setNewQty] = useState(10);

  // Edit order form
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const list = await LogisticsApi.listOrders();
    setOrders(list);
  };

  const handleRowClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (order: SalesOrder) => {
    setSelectedOrder(order);
    setEditCustomerName(order.customer_name);
    setEditRecipientName(order.delivery_address.recipient_name);
    setEditCity(order.delivery_address.city);
    setEditAddress(order.delivery_address.street);
    setEditNotes(order.notes || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const updated = await LogisticsApi.updateOrder(selectedOrder.id, {
        customer_name: editCustomerName,
        delivery_address: {
          ...selectedOrder.delivery_address,
          recipient_name: editRecipientName,
          street: editAddress,
          city: editCity,
        },
        notes: editNotes,
      });
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      setIsEditModalOpen(false);
      setBannerMessage(`✅ Successfully updated details for ${updated.order_number}`);
    } catch (err: any) {
      setBannerMessage(`❌ Failed to update order: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this order? Reserved stock will be automatically released.')) return;
    setActionLoading(true);
    try {
      const cancelled = await LogisticsApi.deleteOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? cancelled : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(cancelled);
      setBannerMessage(`🗑️ Order ${cancelled.order_number} cancelled and stock reservation released.`);
    } catch (err: any) {
      setBannerMessage(`❌ Cancellation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserveStock = async (orderId: string) => {
    setActionLoading(true);
    setSodAlert(null);
    try {
      const updated = await LogisticsApi.reserveStock(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrder(updated);
      setBannerMessage(`✅ Inventory reserved atomically for ${updated.order_number}`);
    } catch (err: any) {
      if (err.message && err.message.includes('SoD Violation')) {
        setSodAlert(err.message);
      } else {
        setBannerMessage(`❌ Failed to reserve stock: ${err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransitionStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setActionLoading(true);
    setSodAlert(null);
    try {
      const updated = await LogisticsApi.transitionStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrder(updated);
      setBannerMessage(`✅ Order transitioned to ${nextStatus}`);
    } catch (err: any) {
      if (err.message && err.message.includes('SoD Violation')) {
        setSodAlert(err.message);
      } else {
        setBannerMessage(`❌ Transition failed: ${err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newRecipientName) return;

    try {
      const created = await LogisticsApi.createOrder({
        customer_id: 'CUST-NEW-01',
        customer_name: newCustomerName,
        items: [
          {
            item_id: crypto.randomUUID(),
            sku: newSku,
            name: newSku === 'MED-VAC-001' ? 'Bio-Pharmaceutical Vaccine Pack (-20C)' : 'Enterprise Edge Gateway Server',
            quantity: Number(newQty),
            unit_price: newSku === 'MED-VAC-001' ? 350000 : 18500000,
            weight_kg: 0.8,
            volume_cbm: 0.002,
          },
        ],
        service_tier: newServiceTier,
        origin_warehouse_id: newOriginWarehouse,
        delivery_address: {
          recipient_name: newRecipientName,
          phone: '+62 812-3344-5566',
          street: newAddress || 'Jl. Gatot Subroto No. 8',
          city: newCity,
          province: 'DKI Jakarta',
          postal_code: '12930',
          latitude: -6.2,
          longitude: 106.8,
        },
        notes: 'Created via ELGS Order Management Console',
      });

      setOrders([created, ...orders]);
      setIsCreateModalOpen(false);
      setBannerMessage(`✅ Sales Order ${created.order_number} created in Draft status`);
    } catch (err: any) {
      setBannerMessage(`❌ Failed to create order: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tracking_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'InTransit':
      case 'OutForDelivery':
        return 'bg-primary/15 text-primary border border-primary/30';
      case 'Picking':
      case 'Packed':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'InventoryReserved':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      case 'Cancelled':
      case 'FailedDelivery':
        return 'bg-destructive/15 text-destructive border border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* SoD Violation Callout Banner */}
      {sodAlert && (
        <div className="flex items-start justify-between rounded-xl border border-destructive/40 bg-destructive/15 p-4 text-xs text-destructive shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Segregation of Duties (SoD) Interception</p>
              <p className="mt-0.5 text-muted-foreground">{sodAlert}</p>
              <p className="mt-1 text-[11px] font-semibold text-foreground">
                Tip: Use the persona switcher in the top navigation to switch to Alexander Hartono (SuperAdmin) or an independent manager to approve!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSodAlert(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Banner message alert */}
      {bannerMessage && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-xs text-foreground shadow-sm">
          <span>{bannerMessage}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Action Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search order number, customer, tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-card-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <label htmlFor="filter-status-select" className="sr-only">Filter by Status</label>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-card text-card-foreground">All Statuses</option>
              <option value="Draft" className="bg-card text-card-foreground">Draft</option>
              <option value="InventoryReserved" className="bg-card text-card-foreground">Inventory Reserved</option>
              <option value="Picking" className="bg-card text-card-foreground">Picking</option>
              <option value="Packed" className="bg-card text-card-foreground">Packed</option>
              <option value="Dispatched" className="bg-card text-card-foreground">Dispatched</option>
              <option value="InTransit" className="bg-card text-card-foreground">In Transit</option>
              <option value="Delivered" className="bg-card text-card-foreground">Delivered</option>
              <option value="Cancelled" className="bg-card text-card-foreground">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Create Order Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Orders Data Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Order Number</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Tier &amp; Hub</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Weight</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-card-foreground">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => handleRowClick(order)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {order.order_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-foreground">{order.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground">{order.delivery_address.city}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                      {order.service_tier}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{order.origin_warehouse_id}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">
                    Rp {order.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    {order.total_weight_kg} kg
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(order)}
                        title="Edit Order"
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Cancel Order"
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-mono text-muted-foreground">ORDER LIFECYCLE</span>
                <h3 className="text-lg font-bold text-card-foreground">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Fulfillment Stage</span>
              <div className="flex items-center gap-1.5">
                {(['Draft', 'InventoryReserved', 'Picking', 'InTransit', 'Delivered'] as OrderStatus[]).map(
                  (step, idx) => {
                    const isPassed =
                      ['Draft', 'InventoryReserved', 'Picking', 'InTransit', 'Delivered'].indexOf(
                        selectedOrder.status
                      ) >= idx;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`h-2 w-full rounded-full ${
                            isPassed ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                        <span className="text-[9px] text-muted-foreground font-mono">{step}</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <span className="text-muted-foreground">Customer</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedOrder.customer_name}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <span className="text-muted-foreground">Tracking Number</span>
                <p className="font-mono font-bold text-primary mt-0.5">{selectedOrder.tracking_number}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <span className="text-muted-foreground">Origin Hub</span>
                <p className="font-medium text-foreground mt-0.5">{selectedOrder.origin_warehouse_id}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <span className="text-muted-foreground">Service Level</span>
                <p className="font-medium text-foreground mt-0.5">{selectedOrder.service_tier}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <span className="text-xs font-bold text-foreground">Cargo Manifest</span>
              <div className="mt-2 space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-foreground">{item.quantity} units</p>
                      <p className="text-[11px] text-muted-foreground">
                        Rp {(item.quantity * item.unit_price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs space-y-1">
              <span className="font-semibold text-foreground">Delivery Destination</span>
              <p className="text-muted-foreground">
                {selectedOrder.delivery_address.recipient_name} ({selectedOrder.delivery_address.phone})
              </p>
              <p className="text-muted-foreground">
                {selectedOrder.delivery_address.street}, {selectedOrder.delivery_address.city}
              </p>
            </div>

            {/* State Machine Transition Actions */}
            <div className="pt-4 border-t border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Dual-Control Actions</span>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'Draft' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleReserveStock(selectedOrder.id)}
                    className="flex-1 rounded-xl bg-primary py-2.5 px-3 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
                  >
                    Reserve Warehouse Stock (Maker-Checker)
                  </button>
                )}

                {selectedOrder.status === 'InventoryReserved' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransitionStatus(selectedOrder.id, 'Picking')}
                    className="flex-1 rounded-xl bg-primary py-2.5 px-3 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
                  >
                    Start Picking Wave
                  </button>
                )}

                {selectedOrder.status === 'Picking' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransitionStatus(selectedOrder.id, 'Packed')}
                    className="flex-1 rounded-xl bg-primary py-2.5 px-3 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
                  >
                    Mark as Packed
                  </button>
                )}

                {selectedOrder.status === 'Packed' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransitionStatus(selectedOrder.id, 'Dispatched')}
                    className="flex-1 rounded-xl bg-primary py-2.5 px-3 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
                  >
                    Dispatch to Fleet
                  </button>
                )}

                {selectedOrder.status === 'Dispatched' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransitionStatus(selectedOrder.id, 'InTransit')}
                    className="flex-1 rounded-xl bg-primary py-2.5 px-3 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
                  >
                    Set In-Transit
                  </button>
                )}

                {selectedOrder.status === 'InTransit' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTransitionStatus(selectedOrder.id, 'Delivered')}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white shadow hover:opacity-90"
                  >
                    Sign Electronic PoD (Delivered)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">
                Edit Order: {selectedOrder.order_number}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={editRecipientName}
                  onChange={(e) => setEditRecipientName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Destination City &amp; Street</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Logistics Instructions</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-card-foreground">Create New Sales Order</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Customer Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bio Farma Persero"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Service Tier</label>
                  <select
                    value={newServiceTier}
                    onChange={(e) => setNewServiceTier(e.target.value as ServiceTier)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Standard">Standard Freight</option>
                    <option value="Express">Express Air (1.5x)</option>
                    <option value="ColdChainPriority">Cold-Chain Cryo (-20°C)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Origin Hub</label>
                  <select
                    value={newOriginWarehouse}
                    onChange={(e) => setNewOriginWarehouse(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="WH-JKT-CENTRAL">Jakarta Central Hub</option>
                    <option value="WH-SBY-EAST">Surabaya Gateway</option>
                    <option value="WH-BDG-WEST">Bandung Crossdock</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Product SKU</label>
                  <select
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="MED-VAC-001">MED-VAC-001 (Vaccine Pack)</option>
                    <option value="ELEC-SRV-042">ELEC-SRV-042 (Edge Server)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Quantity Units</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Destination City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Recipient Name &amp; Address</label>
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow hover:opacity-90"
                >
                  Confirm &amp; Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
