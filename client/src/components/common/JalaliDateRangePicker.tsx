import React, { useState } from 'react';
import { toJalaaliDate, toGregorianISO, parseJalaaliInput } from '../../utils/jalali';

interface JalaliDateRangePickerProps {
  /** Gregorian ISO strings — what the parent stores and sends to the API */
  value: { startDate: string; endDate: string };
  onChange: (range: { startDate: string; endDate: string }) => void;
  label?: string;
  className?: string;
  showJalali?: boolean;
}

/**
 * JalaliDateRangePicker — dual Gregorian/Jalali date range input.
 *
 * Displays Jalali dates (Persian digits) alongside native Gregorian date inputs.
 * Parses Jalali text entry (e.g. ۱۴۰۵/۰۶/۲۸) and converts to Gregorian for the API.
 */
const JalaliDateRangePicker: React.FC<JalaliDateRangePickerProps> = ({
  value,
  onChange,
  label,
  className = '',
  showJalali = true,
}) => {
  const [jalaliStart, setJalaliStart] = useState('');
  const [jalaliEnd, setJalaliEnd] = useState('');
  const [parseError, setParseError] = useState(false);

  // Sync Jalali text when Gregorian value changes
  React.useEffect(() => {
    if (value.startDate) {
      const j = toJalaaliDate(value.startDate);
      if (j) setJalaliStart(formatJalaliShort(j));
    }
    if (value.endDate) {
      const j = toJalaaliDate(value.endDate);
      if (j) setJalaliEnd(formatJalaliShort(j));
    }
    setParseError(false);
  }, [value.startDate, value.endDate]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setJalaliStart(raw);
    const parsed = parseJalaaliInput(raw);
    if (parsed) {
      setParseError(false);
      onChange({ startDate: toGregorianISO(parsed), endDate: value.endDate });
    } else if (raw.length > 0) {
      setParseError(true);
    } else {
      setParseError(false);
      onChange({ startDate: '', endDate: value.endDate });
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setJalaliEnd(raw);
    const parsed = parseJalaaliInput(raw);
    if (parsed) {
      setParseError(false);
      onChange({ startDate: value.startDate, endDate: toGregorianISO(parsed) });
    } else if (raw.length > 0) {
      setParseError(true);
    } else {
      setParseError(false);
      onChange({ startDate: value.startDate, endDate: '' });
    }
  };

  const handleGregorianStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ startDate: e.target.value, endDate: value.endDate });
  };

  const handleGregorianEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ startDate: value.startDate, endDate: e.target.value });
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="label">{label}</span>}

      <div className="flex flex-wrap items-center gap-2">
        {/* Jalali start */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">از:</span>
          <input
            type="text"
            inputMode="text"
            value={jalaliStart}
            onChange={handleStartChange}
            placeholder="۱۴۰۵/۰۶/۲۸"
            className="field num w-32 text-right"
            dir="rtl"
          />
        </div>

        <span className="text-muted text-xs">→</span>

        {/* Jalali end */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">تا:</span>
          <input
            type="text"
            inputMode="text"
            value={jalaliEnd}
            onChange={handleEndChange}
            placeholder="۱۴۰۵/۰۶/۲۸"
            className="field num w-32 text-right"
            dir="rtl"
          />
        </div>

        {/* Native Gregorian date inputs (for direct entry / validation) */}
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={value.startDate}
            onChange={handleGregorianStartChange}
            className="field num w-auto"
            aria-label="تاریخ شمسی (Jalali)"
            title="تاریخ شمسی"
          />
          <span className="text-muted text-xs">→</span>
          <input
            type="date"
            value={value.endDate}
            onChange={handleGregorianEndChange}
            className="field num w-auto"
            aria-label="تاریخ شمسی (Jalali)"
            title="تاریخ شمسی"
          />
        </div>
      </div>

      {parseError && (
        <p className="text-xs text-red-500">
          فرمت تاریخ شمسی نامعتبر است. استفاده کنید: سال/ماه/روز
        </p>
      )}
    </div>
  );
};

/**
 * Format a Jalali date as short string (yyyy/mm/dd in Persian digits).
 */
const formatJalaliShort = (j: { jy: number; jm: number; jd: number }): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toPersianDigits = (s: string) =>
    s.split('').map((c) => {
      const n = parseInt(c, 10);
      if (isNaN(n)) return c;
      return String.fromCharCode(0x06F0 + n);
    }).join('');
  return `${toPersianDigits(String(j.jy))}/${toPersianDigits(pad(j.jm))}/${toPersianDigits(pad(j.jd))}`;
};

export default JalaliDateRangePicker;
