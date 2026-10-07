import React, { useState, useMemo } from 'react';
import { toJalaaliDate, toGregorianISO, parseJalaaliInput, formatJalaaliFa } from '../../utils/jalali';

interface JalaliDateInputProps {
  /** Value as Gregorian ISO string (yyyy-mm-dd) — what the parent stores and sends to the API */
  value: string | null;
  onChange: (gregorianISO: string) => void;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Show Jalali date display above the input */
  showJalali?: boolean;
  /** Custom error message when Jalali parse fails */
  parseError?: string;
}


/**
 * JalaliDateInput — dual-mode date input for Persian users.
 *
 * Display: shows the Jalali date (in Persian digits) above the native date input.
 * Input: native <input type="date"> bound to the Gregorian ISO value.
 * On change: converts Gregorian → Jalali for display; keeps Gregorian for API/DB.
 *
 * Also supports direct Jalali text entry via a secondary input that parses
 * Persian-digit dates and converts them to Gregorian before committing.
 */
const JalaliDateInput: React.FC<JalaliDateInputProps> = ({
  value,
  onChange,
  label,
  className = '',
  error,
  disabled = false,
  placeholder,
  showJalali = true,
  parseError,
}) => {
  // Jalali representation of the current Gregorian value
  const jalali = useMemo(() => toJalaaliDate(value), [value]);

  // For the "direct Jalali entry" mode
  const [jalaliText, setJalaliText] = useState('');
  const [parseFail, setParseFail] = useState(false);

  // Sync jalaliText when value changes from outside
  React.useEffect(() => {
    if (jalali) {
      const fa = formatJalaaliFa(jalali, { showMonth: false });
      if (jalaliText !== fa) setJalaliText(fa);
    } else {
      if (jalaliText !== '') setJalaliText('');
    }
    setParseFail(false);
  }, [jalali, jalaliText]);

  const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (!iso) {
      onChange('');
      return;
    }
    onChange(iso);
  };

  const handleJalaliTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setJalaliText(raw);

    const parsed = parseJalaaliInput(raw);
    if (!parsed) {
      setParseFail(true);
      return;
    }
    setParseFail(false);

    const greg = toGregorianISO(parsed);
    onChange(greg);
  };

  const currentJalaliDisplay = jalali ? formatJalaaliFa(jalali) : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="label" style={{ marginBottom: '2px' }}>
          {label}
        </label>
      )}

      {/* Jalali display / entry row */}
      <div className="flex items-center gap-2">
        {/* Jalali calendar icon */}
        <span className="flex h-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent text-xs">
          📅
        </span>

        {/* Jalali date display (for Gregorian) or Jalali text input */}
        <div className="flex-1 overflow-hidden">
          {showJalali && jalali ? (
            /* Show Jalali date display when we have a Gregorian value */
            <div className="flex items-center gap-2 rounded-xl bg-inset/80 px-3 py-2 text-sm">
              <span className="text-accent font-medium tabular-nums" dir="rtl">
                {currentJalaliDisplay}
              </span>
              <span className="text-muted text-xs">(شمسی)</span>
            </div>
          ) : (
            /* Direct Jalali text entry */
            <input
              type="text"
              inputMode="text"
              value={jalaliText}
              onChange={handleJalaliTextChange}
              onFocus={() => setParseFail(false)}
              placeholder="۱۴۰۵/۰۶/۲۸  یا  1405/06/28"
              className={`field num w-full ${parseFail ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
              disabled={disabled}
              dir="rtl"
              style={{ textAlign: 'right' }}
            />
          )}
        </div>

        {/* Native Gregorian date picker (hidden from Jalali users, but functional) */}
        <input
          type="date"
          value={value || ''}
          onChange={handleGregorianChange}
          disabled={disabled}
          className="field num w-auto sm:w-44"
          style={{ opacity: 0.7, pointerEvents: 'auto' }}
          title="تاریخ شمسی (Jalali)"
          aria-label="تاریخ شمسی"
        />
      </div>

      {/* Parse error */}
      {parseFail && (
        <p className="text-xs text-red-500" style={{ paddingLeft: '28px' }}>
          {parseError || 'تاریخ شمسی نامعتبر است. فرمت: سال/ماه/روز'}
        </p>
      )}

      {/* Error from props */}
      {error && !parseFail && (
        <p className="text-xs text-accent" style={{ paddingLeft: '28px' }}>
          {error}
        </p>
      )}

      {/* Small helper text */}
      <p className="text-xs text-muted" style={{ paddingLeft: '28px' }}>
        تاریخ به فرمت شمسی ذخیره می‌شود و برای بازیافت به تاریخ میلادی تبدیل می‌گردد.
      </p>
    </div>
  );
};

export default JalaliDateInput;
