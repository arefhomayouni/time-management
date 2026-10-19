import { toJalaali, toGregorian } from 'jalaali-js';

export const MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const toJalaaliDate = (
  iso: string | null | undefined,
): { jy: number; jm: number; jd: number } | null => {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const g = toJalaali(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
  return g ? { jy: g.jy, jm: g.jm, jd: g.jd } : null;
};

export const toGregorianISO = (
  j: { jy: number; jm: number; jd: number },
): string => {
  const g = toGregorian(j.jy, j.jm, j.jd);
  if (!g) throw new Error(`Invalid Jalali date: ${j.jy}/${j.jm}/${j.jd}`);
  return `${String(g.gy).padStart(4, '0')}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
};

export const toPersianDigits = (s: string): string =>
  s
    .split('')
    .map((c) => {
      const n = parseInt(c, 10);
      if (isNaN(n)) return c;
      return String.fromCharCode(0x06F0 + n);
    })
    .join('');

const toWesternDigits = (s: string): string =>
  s
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 0x06F0 && code <= 0x06F9) return String(code - 0x06F0);
      if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
      return c;
    })
    .join('');

export const formatJalaaliFa = (
  j: { jy: number; jm: number; jd: number },
  opts: { showMonth?: boolean } = {},
): string => {
  const { showMonth = true } = opts;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const jyStr = toPersianDigits(String(j.jy));
  const jdStr = toPersianDigits(pad2(j.jd));
  const jmStr = toPersianDigits(pad2(j.jm));

  if (!showMonth) return `${jyStr}/${jmStr}/${jdStr}`;

  const monthName = MONTHS_FA[j.jm - 1];
  return `${jyStr}/${jmStr}/${jdStr}  ${monthName}`;
};

export const formatJalaaliShort = (
  j: { jy: number; jm: number; jd: number },
): string => {
  return `${toPersianDigits(String(j.jy))}/${toPersianDigits(String(j.jm).padStart(2, '0'))}/${toPersianDigits(String(j.jd).padStart(2, '0'))}`;
};

export const parseJalaaliInput = (
  raw: string,
): { jy: number; jm: number; jd: number } | null => {
  if (!raw || raw.trim().length === 0) return null;

  const western = toWesternDigits(raw.trim());
  const cleaned = western.replace(/-/g, '-');
  const parts = cleaned.split(/[/-]/).map((s) => s.trim());

  if (parts.length !== 3) return null;
  const nums = parts.map((s) => parseInt(s, 10));
  if (nums.some((n) => isNaN(n))) return null;
  const [jy, jm, jd] = nums;

  if (jm < 1 || jm > 12 || jd < 1 || jd > 31 || jy < -61 || jy > 3177) return null;

  const g = toGregorian(jy, jm, jd);
  if (!g) return null;

  return { jy, jm, jd };
};

/** Today's Jalali date (local timezone). */
export const jalaliToday = (): { jy: number; jm: number; jd: number } => {
  const now = new Date();
  const j = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return j ? { jy: j.jy, jm: j.jm, jd: j.jd } : { jy: 1400, jm: 1, jd: 1 };
};

/**
 * Weekday column (0 = Saturday, Iranian week) of a Jalali date.
 * jalaali-js gives us the Gregorian date; JS getDay() is 0=Sunday.
 */
export const jalaaliWeekdayIndex = (j: {
  jy: number;
  jm: number;
  jd: number;
}): number => {
  const g = toGregorian(j.jy, j.jm, j.jd);
  if (!g) return 0;
  const dow = new Date(g.gy, g.gm - 1, g.gd).getDay();
  return (dow + 1) % 7;
};

export const jalaaliYearRange = (
  length = 50,
  step = 1,
  center?: number,
): { label: string; value: number }[] => {
  const jNow = jalaliToday();
  const c = center ?? jNow.jy;
  const start = c - Math.floor(length / 2);
  const years: { label: string; value: number }[] = [];
  for (let y = start; y < start + length; y += step) {
    const label = toPersianDigits(String(y));
    years.push({ label, value: y });
  }
  return years;
};
