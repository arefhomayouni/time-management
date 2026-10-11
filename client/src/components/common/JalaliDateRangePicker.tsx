import React, { useEffect, useState } from 'react';
import {
  toJalaaliDate,
  toGregorianISO,
  parseJalaaliInput,
  formatJalaaliShort,
} from '../../utils/jalali';
import { useCalendar } from '../../hooks/useCalendar';

interface JalaliDateRangePickerProps {
  /** Gregorian ISO strings - what the parent stores and sends to the API */
  value: { startDate: string; endDate: string };
  onChange: (range: { startDate: string; endDate: string }) => void;
  label?: string;
  className?: string;
}

/**
 * JalaliDateRangePicker - single-calendar date range input.
 *
 * Renders exactly one calendar based on the user's preference (ui.calendar):
 *   - 'jalali'    -> two Persian-digit text inputs (1405/07/16)
 *   - 'gregorian' -> two native date inputs
 * Never both. Values are always Gregorian ISO for the API/DB.
 */
const JalaliDateRangePicker: React.FC<JalaliDateRangePickerProps> = ({
  value,
  onChange,
  label,
  className = '',
}) => {
  const { calendar } = useCalendar();
  const [jalaliStart, setJalaliStart] = useState('');
  const [jalaliEnd, setJalaliEnd] = useState('');
  const [parseError, setParseError] = useState(false);

  // Keep the Jalali text inputs in sync with the Gregorian value
  useEffect(() => {
    if (calendar !== 'jalali') return;
    const s = value.startDate ? toJalaaliDate(value.startDate) : null;
    const e = value.endDate ? toJalaaliDate(value.endDate) : null;
    setJalaliStart(s ? formatJalaaliShort(s) : '');
    setJalaliEnd(e ? formatJalaaliShort(e) : '');
    setParseError(false);
  }, [value.startDate, value.endDate, calendar]);

  const handleJalaliChange = (which: 'start' | 'end') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value;
    if (which === 'start') setJalaliStart(raw);
    else setJalaliEnd(raw);

    // Keep the text field in sync with the parse result so it never jumps
    // back while the user is still typing an intermediate value like
    // "1405/07/". We only overwrite with the normalized short form once the
    // input has become a complete, valid Jalali date.
    const parsed = parseJalaaliInput(raw);
    if (parsed) {
      setParseError(false);
      if (which === 'start') setJalaliStart(formatJalaaliShort(parsed));
      else setJalaliEnd(formatJalaaliShort(parsed));
      onChange(
        which === 'start'
          ? { startDate: toGregorianISO(parsed), endDate: value.endDate }
          : { startDate: value.startDate, endDate: toGregorianISO(parsed) }
      );
    } else if (raw.trim().length > 0) {
      setParseError(true);
    } else {
      setParseError(false);
      onChange(
        which === 'start'
          ? { startDate: '', endDate: value.endDate }
          : { startDate: value.startDate, endDate: '' }
      );
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="label">{label}</span>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">از:</span>
          {calendar === 'jalali' ? (
            <input
              type="text"
              inputMode="text"
              value={jalaliStart}
              onChange={handleJalaliChange('start')}
              placeholder="۱۴۰۵/۰۷/۱۶"
              className="field num w-32 text-right"
              dir="rtl"
              aria-label="تاریخ شروع"
            />
          ) : (
            <input
              type="date"
              value={value.startDate}
              onChange={(e) =>
                onChange({ startDate: e.target.value, endDate: value.endDate })
              }
              className="field num w-auto"
              aria-label="تاریخ شروع"
            />
          )}
        </div>

        <span className="text-muted text-xs">→</span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">تا:</span>
          {calendar === 'jalali' ? (
            <input
              type="text"
              inputMode="text"
              value={jalaliEnd}
              onChange={handleJalaliChange('end')}
              placeholder="۱۴۰۵/۰۸/۱۵"
              className="field num w-32 text-right"
              dir="rtl"
              aria-label="تاریخ پایان"
            />
          ) : (
            <input
              type="date"
              value={value.endDate}
              onChange={(e) =>
                onChange({ startDate: value.startDate, endDate: e.target.value })
              }
              className="field num w-auto"
              aria-label="تاریخ پایان"
            />
          )}
        </div>
      </div>

      {parseError && (
        <p className="text-xs text-red-500">
          فرمت تاریخ شمسی نامعتبر است. سال/ماه/روز وارد کنید.
        </p>
      )}
    </div>
  );
};

export default JalaliDateRangePicker;
