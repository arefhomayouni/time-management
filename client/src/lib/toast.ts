/**
 * Tiny toast store.
 *
 * The app used react-hot-toast's default bar, which could not express the
 * design system (icon chip, detail line, countdown, close button). Keeping the
 * store separate from React means any module can raise a toast from an event
 * handler, a thunk or a plain util with no provider plumbing:
 *
 *   toast.success(t('groups.inv_accepted'));
 *   toast.error(err.data.message, { description: ... });
 *
 * Only success/error/info exist on purpose - the UI has three meaningful
 * states and a generic "info" covers everything else.
 */

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  /** Muted second line, e.g. the server's error code or the amount saved. */
  description?: string;
  /** Milliseconds on screen. Defaults per variant. */
  duration?: number;
}

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration: number;
}

type Listener = () => void;
type Timer = {
  handle: ReturnType<typeof setTimeout>;
  /** Time left when the timer was last started. */
  remaining: number;
  /** When the current run started - used to subtract elapsed time on pause. */
  startedAt: number;
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3500,
  error: 5000,
  info: 4000,
};

/** Beyond this the oldest toast is dropped so the stack never fills the screen. */
const MAX_VISIBLE = 3;

let items: ToastItem[] = [];
let nextId = 1;

const listeners = new Set<Listener>();
const timers = new Map<number, Timer>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

/** subscribe/getSnapshot pair for useSyncExternalStore. */
export const subscribeToasts = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToasts = (): ToastItem[] => items;

const clearTimer = (id: number) => {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer.handle);
  timers.delete(id);
};

function startTimer(id: number, ms: number) {
  const timer: Timer = {
    handle: setTimeout(() => dismiss(id), ms),
    remaining: ms,
    startedAt: Date.now(),
  };
  timers.set(id, timer);
}

/** Removes one toast, or the whole stack when called with no id. */
export function dismiss(id?: number) {
  const removed =
    typeof id === 'number' ? items.filter((toast) => toast.id === id) : items;
  if (!removed.length) return;

  const removedIds = new Set(removed.map((toast) => toast.id));
  items =
    typeof id === 'number' ? items.filter((toast) => toast.id !== id) : [];
  removedIds.forEach(clearTimer);
  emit();
}

/**
 * Stops the countdown while the pointer rests on a toast, so a message the
 * user is reading (or about to act on) does not disappear mid-sentence.
 */
export const pauseToast = (id: number) => {
  const timer = timers.get(id);
  if (!timer) return;
  clearTimeout(timer.handle);
  timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  // A second pause (pointer re-entering) must not subtract the same span twice.
  timer.startedAt = Date.now();
};

/** Restarts the countdown with whatever time was left. */
export const resumeToast = (id: number) => {
  const timer = timers.get(id);
  if (!timer) return;
  const remaining = Math.max(timer.remaining, 1200);
  startTimer(id, remaining);
};

function push(variant: ToastVariant, message: string, options: ToastOptions = {}) {
  const id = nextId++;
  const item: ToastItem = {
    id,
    variant,
    message,
    description: options.description,
    duration: options.duration ?? DEFAULT_DURATION[variant],
  };

  items = [...items, item];
  while (items.length > MAX_VISIBLE) {
    dismiss(items[0].id);
  }

  startTimer(id, item.duration);
  emit();
  return id;
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    push('success', message, options),
  error: (message: string, options?: ToastOptions) =>
    push('error', message, options),
  info: (message: string, options?: ToastOptions) =>
    push('info', message, options),
  dismiss,
};

export default toast;
