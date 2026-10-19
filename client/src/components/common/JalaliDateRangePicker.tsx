import React, { useEffect, useRef, useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import {
  toJalaaliDate,
  toGregorianISO,
  parseJalaaliInput,
  formatJalaaliShort,
} from '../../utils/jalali';
import { useCalendar } from '../../hooks/useCalendar';
import { useLanguage } from '../../hooks/useLanguage';
import JalaliCalendar from './JalaliCalendar';

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
 *   - 'jalali'    -> two Persian-digit text inputs (1405/07/16). Clicking a
 *                    field or its calendar icon opens the Persian month-grid
 *                    picker, so picking a date never requires typing.
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
  const { t } = useLanguage();
  const [jalaliStart, setJalaliStart] = useState('');
  const [jalaliEnd, setJalaliEnd] = useState('');
  const [parseError, setParseError] = useState(false);
  const [open, setOpen] = useState<'start' | 'end' | null>(null);
  /** Anchor rows for the portaled calendar panel (one per field). */
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const anchorFor = (which: 'start' | 'end') =>
    which === 'start' ? startRef : endRef;

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
    // input has become a complete, valid Jalali date, and we only flag an
    // error once all three segments are present.
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
    } else if (raw.split(/[/-]/).length >= 3 && raw.trim().length > 0) {
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

  const pickFrom = (which: 'start' | 'end') => (iso: string) => {
    const j = toJalaaliDate(iso);
    if (j && which === 'start') {
      setJalaliStart(formatJalaaliShort(j));
      onChange({ startDate: iso, endDate: value.endDate });
    } else if (j) {
      setJalaliEnd(formatJalaaliShort(j));
      onChange({ startDate: value.startDate, endDate: iso });
    }
    setParseError(false);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="label">{label}</span>}

      <div className="flex flex-wrap items-center gap-2">
        {(['start', 'end'] as const).map((which) => (
          <React.Fragment key={which}>
            <span className="text-xs text-muted">
              {which === 'start' ? t('common.from') : t('common.to')}
            </span>
            <div
              ref={anchorFor(which)}
              className="relative flex items-center gap-2"
            >
              {calendar === 'jalali' ? (
                <>
                  <input
                    type="text"
                    inputMode="text"
                    value={which === 'start' ? jalaliStart : jalaliEnd}
                    onChange={handleJalaliChange(which)}
                    onClick={() => setOpen(which)}
                    onFocus={() => setParseError(false)}
                    placeholder={
                      which === 'start' ? '۱۴۰۵/۰۷/۱۶' : '۱۴۰۵/۰۸/۱۵'
                    }
                    className="field num w-32 text-right"
                    dir="rtl"
                    aria-label={
                      which === 'start'
                        ? `${t('common.from')} (${t('calendar.jalali')})`
                        : `${t('common.to')} (${t('calendar.jalali')})`
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setOpen((o) => (o === which ? null : which))}
                    aria-label={
                      open === which
                        ? t('common.close')
                        : `${t('calendar.open')} (${t('calendar.jalali')})`
                    }
                    aria-expanded={open === which}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      open === which
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line/70 bg-inset/70 text-muted hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    <CalendarBlank size={15} weight="light" />
                  </button>
                  {open === which && (
                    <JalaliCalendar
                      value={
                        which === 'start'
                          ? value.startDate || null
                          : value.endDate || null
                      }
                      anchorRef={anchorFor(which)}
                      onSelect={pickFrom(which)}
                      onClose={() => setOpen(null)}
                    />
                  )}
                </>
              ) : (
                <input
                  type="date"
                  value={which === 'start' ? value.startDate : value.endDate}
                  onChange={(e) =>
                    onChange(
                      which === 'start'
                        ? { startDate: e.target.value, endDate: value.endDate }
                        : { startDate: value.startDate, endDate: e.target.value }
                    )
                  }
                  className="field num w-auto"
                  aria-label={
                    which === 'start' ? t('common.from') : t('common.to')
                  }
                />
              )}
            </div>
            {which === 'start' && (
              <span className="text-muted text-xs">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {parseError && (
        <p className="text-xs text-red-500" aria-live="polite">
          {t('date.invalid')}
        </p>
      )}
    </div>
  );
};

export default JalaliDateRangePicker;
