import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { jalaaliMonthLength } from 'jalaali-js';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import {
  toJalaaliDate,
  toGregorianISO,
  toPersianDigits,
  formatJalaaliShort,
  jalaliToday,
  jalaaliWeekdayIndex,
  jalaaliYearRange,
  MONTHS_FA,
} from '../../utils/jalali';
import { useLanguage } from '../../hooks/useLanguage';

/** Iranian week starts on Saturday. Single-letter Persian weekday headers. */
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

interface JalaliCalendarProps {
  /** Gregorian ISO (yyyy-mm-dd) currently selected, or null */
  value: string | null;
  /** Called with the Gregorian ISO of the picked day */
  onSelect: (gregorianISO: string) => void;
  onClose: () => void;
  /**
   * The field row the picker belongs to. Used to anchor the panel and to
   * decide which clicks count as "outside".
   */
  anchorRef: React.RefObject<HTMLElement | null>;
}

/**
 * JalaliCalendar - visual Persian month grid.
 *
 * Exists so Persian mode gets the SAME "click a date, pick it from a grid"
 * experience that Gregorian mode gets from the native input[type=date]
 * picker. Values in/out are always Gregorian ISO; only the labels are
 * Jalali. Renders RTL with Persian digits regardless of UI language,
 * because the calendar itself is Persian.
 *
 * The panel is portaled to document.body with document-absolute
 * coordinates. Anything rendered in flow inherits its ancestors' stacking
 * context, and a popup inside e.g. a `relative z-10` page header ends up
 * painted UNDER the `relative z-10` sections that come after it - clicks
 * land on the section behind the calendar and the picker appears broken.
 * A body-level portal (z-50) sits above the page instead, and absolute
 * coordinates still scroll with the page, so no scroll listeners needed.
 */
const JalaliCalendar: React.FC<JalaliCalendarProps> = ({
  value,
  onSelect,
  onClose,
  anchorRef,
}) => {
  const { t } = useLanguage();
  const today = useMemoSafeToday();
  const selected = React.useMemo(() => toJalaaliDate(value), [value]);

  const [view, setView] = useState(() => {
    const base = selected || today;
    return { jy: base.jy, jm: base.jm };
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measure anchor + panel once mounted and place the panel in document
  // coordinates. Two-pass: first render is parked off-screen, this runs
  // before paint so nothing flashes.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const sx = window.scrollX;
    const sy = window.scrollY;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const rtl = getComputedStyle(anchor).direction === 'rtl';

    // Inline-start alignment (right edge first in RTL), clamped on-screen.
    let left = rtl ? a.right - p.width : a.left;
    left = Math.min(Math.max(left, sx + 8), sx + vw - p.width - 8);

    // Below the field; flip above when there is not enough room.
    let top = a.bottom + sy + 8;
    if (a.bottom + 8 + p.height > vh) {
      const above = a.top - p.height - 8 + sy;
      top = above - sy < 8 ? sy + 8 : above;
    }

    setPos({ top, left });
  }, [anchorRef, value]);

  /**
   * Close on Escape or a click outside the panel AND outside the field row
   * (clicking the input keeps the picker open; the icon button toggles it).
   * The document listener is attached on the NEXT tick: the same click
   * that opened this popover is still bubbling when the effect runs, and a
   * listener on document would receive it and close the picker at once.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClick = (e: MouseEvent) => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      const target = e.target as Node;
      if (panel && panel.contains(target)) return;
      if (anchor && anchor.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    const id = window.setTimeout(
      () => document.addEventListener('click', onClick),
      0
    );
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
      document.removeEventListener('click', onClick);
    };
  }, [onClose, anchorRef]);

  const shiftMonth = (delta: number) =>
    setView((v) => {
      let jm = v.jm + delta;
      let jy = v.jy;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      } else if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { jy, jm };
    });

  const daysInMonth = jalaaliMonthLength(view.jy, view.jm);
  const leading = jalaaliWeekdayIndex({ jy: view.jy, jm: view.jm, jd: 1 });
  const todayISO = toGregorianISO(today);
  const years = jalaaliYearRange(61, 1, view.jy);

  const panel = (
    <div
      ref={panelRef}
      dir="rtl"
      role="group"
      aria-label={`${MONTHS_FA[view.jm - 1]} ${toPersianDigits(String(view.jy))}`}
      className="z-50 w-[19.5rem] rounded-2xl border border-line bg-surface p-3 text-start shadow-[0_24px_56px_-20px_rgba(0,0,0,0.5)]"
      style={{
        position: 'absolute',
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {/* Month / year / navigation */}
      <div className="flex items-center gap-1.5 pb-2.5">
        <select
          value={view.jm}
          onChange={(e) => setView((v) => ({ ...v, jm: Number(e.target.value) }))}
          aria-label={t('calendar.month')}
          className="field !w-auto !py-1.5 !ps-2 !pe-7 !text-sm"
        >
          {MONTHS_FA.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={view.jy}
          onChange={(e) => setView((v) => ({ ...v, jy: Number(e.target.value) }))}
          aria-label={t('calendar.year')}
          className="field num !w-auto !py-1.5 !ps-2 !pe-7 !text-sm"
        >
          {years.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </select>

        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label={t('calendar.prev_month')}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-inset hover:text-ink"
          >
            <CaretRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label={t('calendar.next_month')}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-inset hover:text-ink"
          >
            <CaretLeft size={16} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="grid h-7 place-items-center text-[11px] font-semibold text-muted"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} className="h-9" aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const jd = i + 1;
          const j = { jy: view.jy, jm: view.jm, jd };
          const iso = toGregorianISO(j);
          const isSelected = value === iso;
          const isToday = iso === todayISO;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                onSelect(iso);
                onClose();
              }}
              aria-label={formatJalaaliShort(j)}
              aria-current={isToday ? 'date' : undefined}
              className={`num grid h-9 place-items-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-accent font-semibold text-accent-ink shadow-[0_6px_16px_-8px_rgb(var(--c-glow)/0.7)]'
                  : isToday
                    ? 'border border-accent/50 font-semibold text-accent hover:bg-accent/10'
                    : 'border border-transparent text-ink hover:bg-inset'
              }`}
            >
              {toPersianDigits(String(jd))}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2.5">
        <button
          type="button"
          onClick={() => {
            onSelect(todayISO);
            onClose();
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          {t('calendar.today')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-inset hover:text-ink"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
};

/** Today's Jalali date, memoized once per mount. */
function useMemoSafeToday() {
  return React.useMemo(() => jalaliToday(), []);
}

export default JalaliCalendar;
