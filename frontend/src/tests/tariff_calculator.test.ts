import { describe, it, expect } from 'vitest';
import { LogisticsApi } from '../lib/api';

describe('Tariff Calculation Engine', () => {
  it('correctly calculates volumetric weight via IATA divisor (5000 cm3/kg)', async () => {
    // 50 x 40 x 30 = 60,000 / 5000 = 12 kg
    const quote = await LogisticsApi.calculateTariff({
      origin_city: 'Jakarta',
      destination_city: 'Surabaya',
      actual_weight_kg: 5.0,
      length_cm: 50.0,
      width_cm: 40.0,
      height_cm: 30.0,
      requires_cold_chain: false,
      is_express: false,
    });

    expect(quote.volumetric_weight_kg).toBe(12.0);
    expect(quote.chargeable_weight_kg).toBe(12.0);
    expect(quote.total_shipping_cost).toBeGreaterThan(0);
  });

  it('applies cold chain 35% surcharge and express 1.5x multiplier', async () => {
    const standard = await LogisticsApi.calculateTariff({
      origin_city: 'Jakarta',
      destination_city: 'Bandung',
      actual_weight_kg: 10.0,
      length_cm: 20.0,
      width_cm: 20.0,
      height_cm: 20.0,
      requires_cold_chain: false,
      is_express: false,
    });

    const coldExpress = await LogisticsApi.calculateTariff({
      origin_city: 'Jakarta',
      destination_city: 'Bandung',
      actual_weight_kg: 10.0,
      length_cm: 20.0,
      width_cm: 20.0,
      height_cm: 20.0,
      requires_cold_chain: true,
      is_express: true,
    });

    expect(coldExpress.cold_chain_surcharge).toBeGreaterThan(0);
    expect(coldExpress.express_multiplier).toBe(1.5);
    expect(coldExpress.total_shipping_cost).toBeGreaterThan(standard.total_shipping_cost);
  });
});
