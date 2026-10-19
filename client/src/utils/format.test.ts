import { moneyStored, formatCurrencyTotals } from './format';

/**
 * Currency rules under test:
 *  - a recorded amount is already in the unit of the rate that produced it,
 *    so formatting it must never multiply a Rial amount by the USD quote;
 *  - only the display mode converts, and conversions round-trip to the same
 *    stored number.
 */
describe('moneyStored', () => {
  it('shows a Rial-denominated amount as-is in IRR mode', () => {
    expect(moneyStored(25_000_000, 'irr', 'irr')).toBe('﷼ 25,000,000');
  });

  it('converts a Rial amount to USD for display only', () => {
    // 1 USD = 42,000 Toman = 420,000 Rials
    expect(moneyStored(25_000_000, 'irr', 'usd')).toBe('$59.52');
    expect(moneyStored(25_000_000, 'irr', 'dual')).toBe(
      '﷼ 25,000,000 ($59.52)',
    );
  });

  it('shows a USD amount in both units in dual mode', () => {
    expect(moneyStored(100, 'usd', 'dual')).toBe('$100.00 (﷼ 42,000,000)');
    expect(moneyStored(100, 'usd', 'irr')).toBe('﷼ 42,000,000');
  });
});

describe('formatCurrencyTotals', () => {
  const totals = { usd: 100, irr: 25_000_000 };

  it('keeps currencies side by side in dual mode', () => {
    expect(formatCurrencyTotals(totals, 'dual')).toBe(
      '$100.00 + ﷼ 25,000,000',
    );
  });

  it('converts and sums into one number in single-currency modes', () => {
    // 25,000,000 Rials = $59.52 -> $159.52
    expect(formatCurrencyTotals(totals, 'usd')).toBe('$159.52');
    // $100 = 42,000,000 Rials -> ﷼ 67,000,000
    expect(formatCurrencyTotals(totals, 'irr')).toBe('﷼ 67,000,000');
  });

  it('falls back to the legacy total when there is no breakdown', () => {
    expect(formatCurrencyTotals(undefined, 'usd', { amount: 12.5 })).toBe(
      '$12.50',
    );
  });
});
