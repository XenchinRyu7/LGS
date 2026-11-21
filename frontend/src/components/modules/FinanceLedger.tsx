import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Receipt,
  Snowflake,
  Zap,
} from 'lucide-react';
import { LogisticsApi } from '../../lib/api';
import type {
  ShippingRateQuoteRequest,
  ShippingRateQuoteResponse,
  Invoice,
} from '../../types/logistics';

export function FinanceLedger() {
  const [originCity, setOriginCity] = useState('Jakarta');
  const [destinationCity, setDestinationCity] = useState('Surabaya');
  const [actualWeight, setActualWeight] = useState(10);
  const [lengthCm, setLengthCm] = useState(40);
  const [widthCm, setWidthCm] = useState(30);
  const [heightCm, setHeightCm] = useState(25);
  const [requiresColdChain, setRequiresColdChain] = useState(true);
  const [isExpress, setIsExpress] = useState(false);

  const [quote, setQuote] = useState<ShippingRateQuoteResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    handleCalculate();
    LogisticsApi.listInvoices().then(setInvoices);
  }, []);

  const handleCalculate = async () => {
    setCalculating(true);
    const req: ShippingRateQuoteRequest = {
      origin_city: originCity,
      destination_city: destinationCity,
      actual_weight_kg: Number(actualWeight),
      length_cm: Number(lengthCm),
      width_cm: Number(widthCm),
      height_cm: Number(heightCm),
      requires_cold_chain: requiresColdChain,
      is_express: isExpress,
    };
    const res = await LogisticsApi.calculateTariff(req);
    setQuote(res);
    setCalculating(false);
  };

  return (
    <div className="space-y-6">
      {/* Freight Tariff Calculation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-card-foreground">
                Enterprise Freight Tariff Calculator
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              IATA Standard (Divisor: 5000)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground">Origin Hub City</label>
              <select
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Jakarta">Jakarta Central Hub</option>
                <option value="Surabaya">Surabaya Gateway</option>
                <option value="Bandung">Bandung Regional Crossdock</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground">Destination City</label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Surabaya">Surabaya Gateway</option>
                <option value="Jakarta">Jakarta Central Hub</option>
                <option value="Bandung">Bandung Regional Crossdock</option>
              </select>
            </div>
          </div>

          {/* Dimensions & Weight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-foreground">Weight (kg)</label>
              <input
                type="number"
                min="0.1"
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Length (cm)</label>
              <input
                type="number"
                min="1"
                value={lengthCm}
                onChange={(e) => setLengthCm(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Width (cm)</label>
              <input
                type="number"
                min="1"
                value={widthCm}
                onChange={(e) => setWidthCm(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Height (cm)</label>
              <input
                type="number"
                min="1"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Surcharge Switches */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresColdChain}
                onChange={(e) => setRequiresColdChain(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="font-medium text-foreground flex items-center gap-1">
                <Snowflake className="h-3.5 w-3.5 text-cyan-400" />
                Cold-Chain Refrig. (+35%)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExpress}
                onChange={(e) => setIsExpress(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="font-medium text-foreground flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Express Air Priority (1.5x)
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            disabled={calculating}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
          >
            <span>Re-compute Tariff Quotation</span>
          </button>
        </div>

        {/* Calculated Breakdown Card */}
        {quote && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-card-foreground">Tariff Breakdown</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary font-mono">
                {quote.estimated_transit_days} Day SLA
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volumetric Weight:</span>
                <span className="font-mono font-medium text-foreground">
                  {quote.volumetric_weight_kg} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chargeable Weight:</span>
                <span className="font-mono font-bold text-primary">
                  {quote.chargeable_weight_kg} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Freight Rate:</span>
                <span className="font-mono text-foreground">
                  Rp {quote.base_rate.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Index Surcharge:</span>
                <span className="font-mono text-foreground">
                  Rp {quote.fuel_surcharge.toLocaleString()}
                </span>
              </div>
              {quote.cold_chain_surcharge > 0 && (
                <div className="flex justify-between text-cyan-400">
                  <span>Cryo Cold Vault Fee:</span>
                  <span className="font-mono">
                    Rp {quote.cold_chain_surcharge.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground">Total Quoted Freight Cost</span>
              <p className="text-2xl font-black text-foreground mt-0.5">
                Rp {quote.total_shipping_cost.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invoicing Ledger Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-card-foreground">Invoicing &amp; Accounts Ledger</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice ID</th>
                <th className="py-3 px-4 font-semibold">Billed Customer</th>
                <th className="py-3 px-4 font-semibold">Subtotal</th>
                <th className="py-3 px-4 font-semibold">Tax (11% PPN)</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-card-foreground">
              {invoices.map((inv) => (
                <tr key={inv.invoice_id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    {inv.customer_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    Rp {inv.subtotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    Rp {inv.tax_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    Rp {inv.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    {new Date(inv.due_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
