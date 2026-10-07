import { toJalaali, toGregorian } from 'jalaali-js';
import { toJalaaliDate, toGregorianISO, type parseJalaaliInput, formatJalaaliFa } from './jalali';

export interface JalaliRange {
  /** Jalali year */
  jy: number;
  /** Jalali month (1-12) */
  jm: number;
  /** Jalali day */
  jd: number;
}

export interface JalaliDateRange {
  startDate: JalaliRange;
  endDate: JalaliRange;
}

/**
 * Convert a Jalali range to Gregorian ISO strings for the API.
 */
export const jalaliRangeToGregorian = (range: JalaliDateRange): { startDate: string; endDate: string } => ({
  startDate: toGregorianISO(range.startDate),
  endDate: toGregorianISO(range.endDate),
});

/**
 * Convert Gregorian ISO strings to a Jalali date range for display.
 */
export const gregorianToJalaliRange = (
  startISO: string,
  endISO: string,
): JalaliDateRange | null => {
  const s = toJalaaliDate(startISO);
  const e = toJalaaliDate(endISO);
  if (!s || !e) return null;
  return { startDate: s, endDate: e };
};

/**
 * Format a Jalali date range for display.
 */
export const formatJalaliRange = (
  range: JalaliDateRange,
  opts: { showMonthNames?: boolean } = {},
): string => {
  const { showMonthNames = true } = opts;
  const s = formatJalaaliFa(range.startDate, { showMonth: showMonthNames });
  const e = formatJalaaliFa(range.endDate, { showMonth: showMonthNames });
  return `${s}  →  ${e}`;
};
