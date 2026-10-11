/**
 * Money formatting with currency switcher.
 *
 * USD mode: $1,234.56
 * IRR mode: ﷼ 123,456 (Rials shown as integers, no decimals)
 * Dual mode: $1,234.56 (﷼ 5,186,400,000) as PLAIN TEXT.
 *
 * IMPORTANT: this returns a plain string that components interpolate
 * directly into JSX. It must never contain HTML/markup: React escapes
 * strings, so any <span> here would render literally in the UI.
 *
 * Design note: the rate currency is the unit the user typed the number in.
 * A rate tagged 'irr' is typed in Rials and is shown exactly as typed - no
 * conversion, no multiplier. A rate tagged 'usd' is shown in USD.
 *
 * moneyFmt() is the DISPLAY-MODE formatter: it takes a USD-denominated number
 * and, in irr/dual mode, converts it to Rials for display. moneyByRateCurrency()
 * never converts: it trusts the unit already stored.
 */
import { useAppSelector } from '../store/hooks';
import type { RateCurrency } from '../store/slices/authSlice';

export type MoneyOpts = {
  currency?: 'usd' | 'irr';
  dual?: boolean;
};

/**
 * IRR rate is quoted in Toman (1 USD ≈ IRR_RATE Toman). Display is in Rials,
 * and 1 Toman = 10 Rials, so USD → Rials multiplies by IRR_RATE * 10.
 * Override with REACT_APP_IRR_RATE if the quote convention changes.
 */
const IRR_RATE = Number(process.env.REACT_APP_IRR_RATE) || 42_000;
const RIALS_PER_TOMAN = 10;

/**
 * Pure formatter. Pick currency explicitly; dual mode shows USD + IRR.
 * Returns a plain-text string (no markup) safe to drop into JSX.
 */
export const moneyFmt = (
  n: number | undefined | null,
  opts: MoneyOpts = {},
): string => {
  const v = Number(n || 0);
  const currency = opts.currency ?? 'usd';
  const dual = opts.dual !== false;

  if (currency === 'irr') {
    // Display mode: the incoming number is USD, show its Rial equivalent.
    const irl = Math.round(v * IRR_RATE * RIALS_PER_TOMAN);
    return `﷼ ${irl.toLocaleString('en-US')}`;
  }

  const usd = `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (dual && currency === 'usd') {
    const irrVal = Math.round(v * IRR_RATE * RIALS_PER_TOMAN);
    const irr = `﷼ ${irrVal.toLocaleString('en-US')}`;
    return `${usd} (${irr})`;
  }

  return usd;
};

export { moneyFmt as money };

/**
 * Format a number using the rate's OWN currency — the currency the user
 * typed the rate in. Entering USD always shows USD; entering IRR always
 * shows IRR. No cross-currency flip-flop. Keeps convert/dual machinery
 * (money(), ui.currency, navbar cycle) untouched for amounts with no
 * stored currency.
 */
export const moneyByRateCurrency = (
  n: number | undefined | null,
  rateCurrency: RateCurrency,
  opts: MoneyOpts = {},
): string => {
  // When a rate was entered in IRR, display in IRR (no conversion).
  // When entered in USD, display in USD. opts.dual only applies to USD.
  const dual = opts.dual !== false;

  // A rate tagged 'irr' was typed in Rials. Show it exactly as typed.
  if (rateCurrency === 'irr') {
    const v = Number(n || 0);
    return `﷼ ${Math.round(v).toLocaleString('en-US')}`;
  }

  // USD-rated rate: show USD; dual opt-in shows the IRR equivalent.
  return moneyFmt(n, { currency: 'usd', dual });
};

/**
 * React hook that returns a mode-aware formatter. Call at the top of your
 * component. The returned function picks USD, IRR, or dual based on the
 * current ui.currency slice (persisted to localStorage).
 *
 * This is intentionally separate from rate-currency display. Use
 * moneyByRateCurrency when showing a rate in the currency the user typed it
 * in; use this hook when showing amounts where the UI currency mode is the
 * source of truth (profiles, summaries, totals without a stored rate currency).
 */
export const useMoney = (): ((n: number | undefined | null, opts?: MoneyOpts) => string) => {
  const currency = useAppSelector((s) => s.ui.currency);
  return (n, opts) => {
    const mode: 'usd' | 'irr' | 'dual' = opts?.currency ? opts.currency : currency;
    if (mode === 'dual') return moneyFmt(n, { currency: 'usd', dual: true });
    return moneyFmt(n, { currency: mode, dual: false });
  };
};

/** Hours: drop trailing .0 but keep halves (6.5, 8). */
export const hours = (n: number | undefined | null): string => {
  const v = Number(n || 0);
  return v % 1 === 0 ? String(v) : v.toFixed(1);
};

/** yyyy-mm-dd for input[type=date] from a Date or ISO string. */
export const toDateInput = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** First and last day of a month (1-12) as yyyy-mm-dd. */
export const monthRange = (year: number, month: number) => ({
  startDate: toDateInput(new Date(year, month - 1, 1)),
  endDate: toDateInput(new Date(year, month, 0)),
});

/** Short human date like "Oct 12, 2026" (stable across locales). */
export const shortDate = (d: string | Date): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
