/** Money: always two decimals, thousands separators, USD-style symbol. */
export const money = (n: number | undefined | null): string => {
  const v = Number(n || 0);
  return `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
