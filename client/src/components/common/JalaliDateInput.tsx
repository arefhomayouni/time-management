import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import {
  toJalaaliDate,
  toGregorianISO,
  parseJalaaliInput,
  formatJalaaliFa,
  formatJalaaliShort,
} from '../../utils/jalali';
import { useCalendar } from '../../hooks/useCalendar';
import { useLanguage } from '../../hooks/useLanguage';
import JalaliCalendar from './JalaliCalendar';

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
 * toggle (ui.calendar):
 *   - 'jalali'    -> Persian text entry PLUS the Persian month-grid picker
 *                    (clicking the field or the calendar icon opens it, the
 *                    same way the native Gregorian picker opens)
 *   - 'gregorian' -> the native input[type=date] picker
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
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  /** Anchors the portaled calendar panel to this field row. */
  const rowRef = useRef<HTMLDivElement>(null);

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
    // snapping back. We only flag a parse error once the input has all
    // three segments (year/month/day) - an unfinished value is not a
    // mistake yet, so no red text while typing.
    const parsed = parseJalaaliInput(raw);
    if (!parsed) {
      const segments = raw.split(/[/-]/).length;
      setParseFail(segments >= 3 && raw.trim().length > 0);
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

      <div ref={rowRef} className="relative flex items-center gap-2">
        {calendar === 'jalali' ? (
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setOpen((o) => !o);
            }}
            disabled={disabled}
            aria-label={
              open
                ? t('common.close')
                : `${t('calendar.open')} (${t('calendar.jalali')})`
            }
            aria-expanded={open}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              open
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line/70 bg-inset/70 text-muted hover:border-accent/40 hover:text-accent'
            }`}
          >
            <CalendarBlank size={16} weight="light" />
          </button>
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-inset/70 text-muted"
            aria-hidden="true"
          >
            <CalendarBlank size={16} weight="light" />
          </span>
        )}

        {calendar === 'jalali' ? (
          <>
            <input
              type="text"
              inputMode="text"
              value={jalaliText}
              onChange={handleJalaliTextChange}
              onFocus={() => setParseFail(false)}
              onClick={() => !disabled && setOpen(true)}
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
            {open && !disabled && (
              <JalaliCalendar
                value={value}
                anchorRef={rowRef}
                onSelect={(iso) => onChange(iso)}
                onClose={() => setOpen(false)}
              />
            )}
          </>
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
          {parseError || t('date.invalid')}
        </p>
      )}

      {error && !parseFail && <p className="text-xs text-accent">{error}</p>}

      {calendar === 'jalali' && !parseFail && !error && (
        <p className="text-xs text-muted">{t('date.hint')}</p>
      )}
    </div>
  );
};

export default DateField;
