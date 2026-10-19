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
  const language = useAppSelector((s) => s.ui.language);

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
      // Gregorian dates follow the interface language, so a Persian UI does
      // not show English month names next to Persian labels. The -u-ca-gregory
      // extension is required: plain 'fa-IR' formats with the PERSIAN calendar,
      // which would turn a Gregorian-mode date into a Jalali one.
      return shortDate(
        iso,
        language === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US'
      );
    },
    [calendar, language]
  );

  return { calendar, formatDate };
};

export default useCalendar;
