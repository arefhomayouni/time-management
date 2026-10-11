import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CalendarBlank, CalendarCheck, X } from '@phosphor-icons/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCalendar, dismissCalendarAsk } from '../../store/slices/uiSlice';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * CalendarChooser - first-visit question.
 *
 * Asks which calendar the user wants the whole app to show (dates they
 * enter and dates they read). The answer is persisted to ui.calendar and
 * used by every date field and date display; the navbar toggle can
 * change it later. Never shown again once answered or dismissed.
 */
const CalendarChooser: React.FC = () => {
  const dispatch = useAppDispatch();
  const asked = useAppSelector((s) => s.ui.calendarAsked);
  const calendar = useAppSelector((s) => s.ui.calendar);
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  /**
   * `asked` alone is not enough to unmount: framer-motion keeps the exiting
   * node alive until its exit animation resolves, and if that never happens
   * (nested spring under React 19) an invisible full-screen overlay is left
   * behind that swallows every click on the page. So mirror `asked` into a
   * local flag and hard-clear it once the exit window has elapsed. The
   * animation still plays; the node is guaranteed gone afterwards.
   */
  const [mounted, setMounted] = useState(!asked);

  useEffect(() => {
    if (!asked) {
      setMounted(true);
      return;
    }
    const id = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(id);
  }, [asked]);

  const options: {
    key: 'jalali' | 'gregorian';
    title: string;
    sample: string;
    hint: string;
    Icon: React.ComponentType<any>;
  }[] = [
    {
      key: 'jalali',
      title: t('calendar.jalali'),
      sample: '۱۴۰۵/۰۷/۱۶',
      hint: t('calendar.jalali_hint'),
      Icon: CalendarCheck,
    },
    {
      key: 'gregorian',
      title: t('calendar.gregorian'),
      sample: 'Oct 8, 2026',
      hint: t('calendar.gregorian_hint'),
      Icon: CalendarBlank,
    },
  ];

  return (
    <AnimatePresence>
      {mounted && !asked && (
        <motion.div
          key="calendar-chooser"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={t('calendar.title')}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8"
            initial={reduce ? false : { y: 32, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { y: 24, opacity: 0, scale: 0.97, transition: { duration: 0.2 } }
            }
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <button
              onClick={() => dispatch(dismissCalendarAsk())}
              className="absolute end-4 top-4 rounded-full p-1.5 text-muted transition-colors hover:bg-inset hover:text-ink"
              aria-label={t('common.close')}
            >
              <X size={16} />
            </button>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {t('calendar.eyebrow')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {t('calendar.title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t('calendar.subtitle')}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {options.map((o) => {
                const active = calendar === o.key;
                return (
                  <motion.button
                    key={o.key}
                    type="button"
                    onClick={() => dispatch(setCalendar(o.key))}
                    whileHover={reduce ? undefined : { y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    className={`rounded-2xl border p-5 text-start transition-colors ${
                      active
                        ? 'border-accent bg-accent/[0.07] shadow-[0_10px_30px_-16px_rgb(var(--c-glow)/0.5)]'
                        : 'border-line bg-inset/50 hover:border-accent/40'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${
                        active
                          ? 'bg-accent text-accent-ink'
                          : 'bg-surface text-accent border border-line/70'
                      }`}
                    >
                      <o.Icon size={17} weight={active ? 'fill' : 'regular'} />
                    </span>
                    <span className="mt-3 block font-semibold text-ink">
                      {o.title}
                    </span>
                    <span
                      className={`num mt-1 block text-lg font-semibold ${
                        active ? 'text-accent' : 'text-muted'
                      }`}
                      dir={o.key === 'jalali' ? 'rtl' : 'ltr'}
                    >
                      {o.sample}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-muted">
                      {o.hint}
                    </span>
                    <span className="sr-only">
                      {active ? t('calendar.selected') : t('calendar.choose')}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => dispatch(dismissCalendarAsk())}
              className="mt-5 w-full text-xs text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {t('calendar.later')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalendarChooser;
