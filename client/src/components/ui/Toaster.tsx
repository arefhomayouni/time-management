import React, { useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Info, Warning, X } from '@phosphor-icons/react';
import {
  dismiss,
  getToasts,
  pauseToast,
  resumeToast,
  subscribeToasts,
  ToastItem,
  ToastVariant,
} from '../../lib/toast';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * Per-variant look. Values point at the design tokens in index.css, so the
 * cards flip with light/dark mode and never hardcode a colour.
 */
const VARIANTS: Record<
  ToastVariant,
  { Icon: React.ElementType; chip: string; bar: string }
> = {
  success: {
    Icon: Check,
    chip: 'bg-[rgb(var(--c-success)/0.14)] text-[rgb(var(--c-success))]',
    bar: 'bg-[rgb(var(--c-success))]',
  },
  error: {
    Icon: Warning,
    chip: 'bg-[rgb(var(--c-error)/0.14)] text-[rgb(var(--c-error))]',
    bar: 'bg-[rgb(var(--c-error))]',
  },
  info: {
    Icon: Info,
    chip: 'bg-[rgb(var(--c-secondary)/0.14)] text-[rgb(var(--c-secondary))]',
    bar: 'bg-[rgb(var(--c-secondary))]',
  },
};

const ToastCard: React.FC<{ item: ToastItem }> = ({ item }) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const { Icon, chip, bar } = VARIANTS[item.variant];

  return (
    <motion.div
      layout
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
      role={item.variant === 'error' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => pauseToast(item.id)}
      onMouseLeave={() => resumeToast(item.id)}
      className="group pointer-events-auto w-full overflow-hidden rounded-2xl border border-line/70 bg-surface/95 shadow-[0_18px_44px_-18px_rgba(24,16,10,0.38)] backdrop-blur-xl"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${chip}`}
          aria-hidden="true"
        >
          <Icon size={17} weight="bold" />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="break-words text-[13.5px] font-semibold leading-snug text-ink">
            {item.message}
          </p>
          {item.description && (
            <p className="mt-1 break-words text-xs leading-relaxed text-muted">
              {item.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => dismiss(item.id)}
          aria-label={t('common.close')}
          className="-me-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-inset hover:text-ink focus-visible:bg-inset"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Countdown: also pauses on hover so it matches the store timer. */}
      <div className="h-[2px] w-full bg-line/30" aria-hidden="true">
        <div
          className={`toast-countdown h-full ${bar}`}
          style={{ animationDuration: `${item.duration}ms` }}
        />
      </div>
    </motion.div>
  );
};

/**
 * Fixed, non-blocking stack: bottom-centre above the mobile tab bar, and
 * bottom-right on desktop where a pointer is precise. `flex-col-reverse`
 * keeps the newest toast closest to the thumb / screen edge.
 */
const Toaster: React.FC = () => {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-tabbar-h)+1rem+env(safe-area-inset-bottom,0px))] z-[80] px-4 lg:inset-x-auto lg:bottom-6 lg:end-6 lg:w-[23rem] lg:px-0"
    >
      <div className="mx-auto flex w-full max-w-sm flex-col-reverse gap-2 lg:mx-0 lg:max-w-none">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Toaster;
