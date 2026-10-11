import React, { useEffect, useMemo, useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import {
  toJalaaliDate,
  toGregorianISO,
  parseJalaaliInput,
  formatJalaaliFa,
  formatJalaaliShort,
} from '../../utils/jalali';
import { useCalendar } from '../../hooks/useCalendar';

interface DateFieldProps {
  /** Value as Gregorian ISO string (yyyy-mm-dd) - what the parent stores and sends to the API */
  value: string | null;
  onChange: (gregorianISO: string) => void;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Custom error message when Jalali parse fails */
  parseError?: string;
}

/**
 * DateField - single-calendar date input.
 *
 * Shows exactly ONE calendar, whichever the user picked in the navbar
 * toggle (ui.calendar): Jalali text entry, or the native Gregorian picker.
 * Never both at once.
 *
 * Storage is always Gregorian ISO regardless of what is displayed.
 */
const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  label,
  className = '',
  error,
  disabled = false,
  placeholder,
  parseError,
}) => {
  const { calendar } = useCalendar();

  // Jalali text the user is typing (Persian or Latin digits)
  const [jalaliText, setJalaliText] = useState('');
  const [parseFail, setParseFail] = useState(false);

  const jalali = useMemo(() => toJalaaliDate(value), [value]);

  // Keep the Jalali text in sync when the value changes from outside
  useEffect(() => {
    if (calendar !== 'jalali') return;
    const next = jalali ? formatJalaaliFa(jalali, { showMonth: false }) : '';
    setJalaliText((prev) => (prev === next ? prev : next));
    setParseFail(false);
  }, [jalali, calendar]);

  const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || '');
  };

  const handleJalaliTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setJalaliText(raw);

    // Commit the current text even when it is not yet parseable, so the
    // user can type intermediate strings like "1405/07/" without the field
    // snapping back. We only keep parseFail so we can show a hint; we never
    // overwrite the user's input with the last good value.
    const parsed = parseJalaaliInput(raw);
    if (!parsed) {
      setParseFail(raw.trim().length > 0);
      return;
    }
    setParseFail(false);
    setJalaliText(formatJalaaliShort(parsed));
    onChange(toGregorianISO(parsed));
  };

  const shownPlaceholder =
    placeholder ||
    (calendar === 'jalali' ? '۱۴۰۵/۰۷/۱۶  یا  1405/07/16' : 'yyyy-mm-dd');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="label" style={{ marginBottom: '2px' }}>
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-inset/70 text-muted"
          aria-hidden="true"
        >
          <CalendarBlank size={16} weight="light" />
        </span>

        {calendar === 'jalali' ? (
          <input
            type="text"
            inputMode="text"
            value={jalaliText}
            onChange={handleJalaliTextChange}
            onFocus={() => setParseFail(false)}
            placeholder={shownPlaceholder}
            className={`field num w-full ${
              parseFail
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : ''
            }`}
            disabled={disabled}
            dir="rtl"
            style={{ textAlign: 'right' }}
            aria-invalid={parseFail || undefined}
          />
        ) : (
          <input
            type="date"
            value={value || ''}
            onChange={handleGregorianChange}
            disabled={disabled}
            className="field num w-full"
          />
        )}
      </div>

      {parseFail && (
        <p className="text-xs text-red-500" aria-live="polite">
          {parseError || 'تاریخ شمسی نامعتبر است. فرمت: سال/ماه/روز'}
        </p>
      )}

      {error && !parseFail && <p className="text-xs text-accent">{error}</p>}

      {calendar === 'jalali' && !parseFail && !error && (
        <p className="text-xs text-muted">
          تاریخ شمسی وارد کنید؛ به‌صورت میلادی ذخیره می‌شود.
        </p>
      )}
    </div>
  );
};

export default DateField;
