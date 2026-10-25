import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { useLanguage } from '../../hooks/useLanguage';
import { storage } from '../../store/storage';

/** The subset of Chrome's non-standard install event we rely on. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** Snooze key holds the timestamp until which the prompt stays quiet. */
const DISMISS_KEY = 'install-prompt-until';
/** A dismissal is respected for a month - long enough not to nag. */
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
/** Let people look around before asking them to install. */
const SHOW_DELAY_MS = 8000;

/**
 * True when the page is already running as an installed app. In that case
 * `beforeinstallprompt` never fires, but iOS Safari also needs its own
 * `navigator.standalone` flag checked.
 */
export const isInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return (
    iosStandalone ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches)
  );
};

/**
 * Exposes the deferred install event so any surface can offer installation
 * (the floating card below, and the mobile "more" sheet as the permanent
 * entry point once the card has been dismissed).
 */
export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  /** The event can only be prompted once; remember when it is spent. */
  const spent = useRef(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      // Chrome would otherwise show its own mini-infobar; we ask in-app.
      event.preventDefault();
      spent.current = false;
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      spent.current = true;
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!promptEvent || spent.current) return 'unavailable';
    spent.current = true;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch {
      // Browsers reject a prompt that is not tied to a user gesture anymore.
      return 'unavailable';
    } finally {
      setPromptEvent(null);
    }
  };

  return { canInstall: Boolean(promptEvent) && !spent.current, install };
};

/**
 * Install invitation card.
 *
 * Replaces the old banner that was pinned to the top of the viewport: that
 * one sat on top of the navigation and had no way out. This card lives at the
 * bottom (above the tab bar on phones, bottom-left on desktop), has two
 * explicit exits, remembers a dismissal for a month and never renders when
 * the app is already installed or running standalone.
 */
const InstallPrompt: React.FC = () => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const { canInstall, install } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show only after the visitor has had a chance to look around, and only if
  // they have not dismissed (or installed) recently.
  useEffect(() => {
    if (!canInstall) return;
    if (isInstalled()) return;
    if (storage.get<number>(DISMISS_KEY, 0) > Date.now()) return;

    const id = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [canInstall]);

  const snooze = () => {
    storage.set(DISMISS_KEY, Date.now() + SNOOZE_MS);
    setVisible(false);
  };

  const handleInstall = async () => {
    setBusy(true);
    const outcome = await install();
    setBusy(false);
    // Accepted: the app is installed, so never ask again on this device.
    // Dismissed in the native sheet: respect that for a month too.
    storage.set(
      DISMISS_KEY,
      Date.now() + (outcome === 'accepted' ? SNOOZE_MS * 12 : SNOOZE_MS)
    );
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && canInstall && (
        <motion.div
          key="install-prompt"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label={t('nav.install_app')}
          className="fixed inset-x-0 bottom-[calc(var(--mobile-tabbar-h)+1rem+env(safe-area-inset-bottom,0px))] z-[58] px-4 lg:inset-x-auto lg:bottom-6 lg:start-6 lg:px-0"
        >
          <div className="mx-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line/70 bg-surface/95 p-3.5 shadow-[0_20px_45px_-22px_rgba(24,16,10,0.45)] backdrop-blur-xl lg:mx-0">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"
              aria-hidden="true"
            >
              <DownloadSimple size={18} weight="bold" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold leading-snug text-ink">
                {t('nav.install_app')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t('nav.install_hint')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={busy}
                  className="btn-primary !px-3.5 !py-1.5 text-xs disabled:opacity-60"
                >
                  <DownloadSimple size={14} weight="bold" />
                  {t('nav.install')}
                </button>
                <button
                  type="button"
                  onClick={snooze}
                  className="btn-ghost !px-3.5 !py-1.5 text-xs"
                >
                  {t('nav.install_later')}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={snooze}
              aria-label={t('common.close')}
              className="-me-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-inset hover:text-ink"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
