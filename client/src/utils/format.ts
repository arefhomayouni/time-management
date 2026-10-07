/**
 * Money formatting with currency switcher.
 *
 * USD mode: $1,234.56
 * IRR mode: ﷼ 123,456  (Rials per Toman shown as integers, no decimals)
 *
 * When dual=true, both currencies are shown — USD primary, IRR in
 * muted small type next to it. This is the default for price labels
 * so users see both counts at once.
 */
import { useAppSelector } from '../store/hooks';

export type MoneyOpts = {
  currency?: 'usd' | 'irr';
  dual?: boolean;
};

/** IRR rate: 1 Toman = 10 Rials. Display in Rials as integers. */
export const IRR_PER_TOMAN = 10;
const IRR_RATE = Number(process.env.REACT_APP_IRR_RATE) || 42_000; // 1 USD ≈ IRR_Rate IRR

/**
 * Pure formatter. Pick currency explicitly; dual mode shows USD + IRR.
 * Returns a string the component interpolates directly.
 */
export const moneyFmt = (
  n: number | undefined | null,
  opts: MoneyOpts = {},
): string => {
  const v = Number(n || 0);
  const currency = opts.currency ?? 'usd';
  const dual = opts.dual !== false;

  if (currency === 'irr') {
    // Display Rials as integers (Tomans × 10)
    const tomansInRials = Math.round(v * IRR_PER_TOMAN);
    const irl = Math.round(tomansInRials * IRR_RATE);
    return `﷼ ${irl.toLocaleString('en-US')}`;
  }

  const usd = `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (dual && currency === 'usd') {
    const irrVal = Math.round(v * IRR_PER_TOMAN * IRR_RATE);
    const irr = `﷼ ${irrVal.toLocaleString('en-US')}`;
    return `${usd} <span className="text-muted font-normal"> (${irr})</span>`;
  }

  return usd;
};

export { moneyFmt as money };

/**
 * React hook that returns a mode-aware formatter. Call at the top of your
 * component. The returned function picks USD, IRR, or dual based on the
 * current ui.currency slice (persisted to localStorage).
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
