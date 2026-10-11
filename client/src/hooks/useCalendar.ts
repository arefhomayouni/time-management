import { useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import type { CalendarMode } from '../store/slices/uiSlice';
import { toJalaaliDate, formatJalaaliFa } from '../utils/jalali';
import { shortDate } from '../utils/format';

/**
 * Calendar preference hook.
 *
 * The DB always stores Gregorian ISO dates. The UI renders whichever
 * calendar the user picked (navbar toggle / first-visit chooser):
 *   - 'jalali'    -> 1405/07/16  مهر
 *   - 'gregorian' -> Oct 8, 2026
 *
 * `formatDate` returns '' for empty input so callers can guard on it.
 */
export const useCalendar = (): {
  calendar: CalendarMode;
  formatDate: (d: string | Date | null | undefined) => string;
} => {
  const calendar = useAppSelector((s) => s.ui.calendar);

  const formatDate = useCallback(
    (d: string | Date | null | undefined): string => {
      if (!d) return '';
      const iso =
        typeof d === 'string'
          ? d.slice(0, 10)
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
              d.getDate()
            ).padStart(2, '0')}`;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return shortDate(d);

      if (calendar === 'jalali') {
        const j = toJalaaliDate(iso);
        if (j) return formatJalaaliFa(j);
      }
      return shortDate(iso);
    },
    [calendar]
  );

  return { calendar, formatDate };
};

export default useCalendar;
