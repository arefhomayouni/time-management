import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { syncSystemTheme } from './store/slices/uiSlice';
import { useLanguage } from './hooks/useLanguage';
import { onPwaUpdate } from './pwa';
import Navbar from './components/Navbar';
import CalendarChooser from './components/common/CalendarChooser';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import GroupCreatePage from './pages/GroupCreatePage';
import GroupDetailPage from './pages/GroupDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import AboutPage from './pages/AboutPage';
import HowToPage from './pages/HowToPage';
import ContactPage from './pages/ContactPage';
import SearchPage from './pages/SearchPage';
import MobileTopBar from './components/mobile/MobileTopBar';
import MobileTabBar from './components/mobile/MobileTabBar';
import MoreSheet from './components/mobile/MoreSheet';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

/** Scrolls to top on every navigation */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/**
 * Keeps <html class="dark">, the PWA theme-color meta and the OS color
 * scheme in sync with the ui slice.
 *
 * When the user follows the system we listen to `prefers-color-scheme` so
 * an installed PWA flips with the phone (e.g. at sunset) with no reload.
 * An explicit choice overrides the listener until it is changed again.
 */
const ThemeSync: React.FC = () => {
  const preference = useAppSelector((s) => s.ui.theme);
  const resolved = useAppSelector((s) => s.ui.resolvedTheme);
  const dispatch = useAppDispatch();

  // Track the OS scheme so 'system' stays live. matchMedia is the only
  // API that reports it; guard for very old browsers.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) =>
      dispatch(syncSystemTheme(e.matches));
    // Seed once on mount, then follow changes.
    dispatch(syncSystemTheme(mq.matches));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [dispatch]);

  // Paint the resolved theme on <html> and the browser/PWA chrome.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    // Tells the UA how to render form controls / scrollbars for this theme.
    root.style.colorScheme = resolved;

    // Match the installed-app status bar / title bar to the page background
    // so the standalone window's chrome never clashes with the theme.
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    // Resolve --c-bg (an rgb triplet) through a probe so we hand the
    // browser a concrete color rather than a CSS variable it can't parse.
    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.backgroundColor = 'rgb(var(--c-bg))';
    document.body.appendChild(probe);
    meta.content = getComputedStyle(probe).backgroundColor;
    probe.remove();
  }, [resolved]);

  // Expose the active preference for debugging / future UI.
  useEffect(() => {
    document.documentElement.dataset.themePreference = preference;
  }, [preference]);

  return null;
};

/** Offers a reload when the service worker installs a newer build. */
const PwaUpdateBanner: React.FC = () => {
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => onPwaUpdate(({ apply }) => setApplyUpdate(() => apply)), []);

  if (!applyUpdate || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-lg">
        <span className="text-sm text-ink">A new version is ready.</span>
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="text-sm text-muted hover:text-ink"
        >
          Later
        </button>
      </div>
    </div>
  );
};

/** The subset of the non-standard Chrome event we rely on. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const install = () => {
    if (!deferredPrompt) return;
    void deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  return { install, deferredPrompt };
};

/**
 * Install prompt banner. Lives inside <Provider> because it reads the
 * active language through useLanguage().
 */
const InstallPromptBanner: React.FC = () => {
  const { t } = useLanguage();
  const { install, deferredPrompt } = useInstallPrompt();

  // Touch devices get the native app chrome instead of a desktop banner.
  const isPointerFine =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  if (!deferredPrompt || !isPointerFine) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[55] flex justify-center px-4" role="region" aria-label={t('nav.install_app')}>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-lg">
        <span className="text-sm text-ink">{t('nav.install_app')}</span>
        <button
          type="button"
          onClick={install}
          className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
        >
          {t('nav.install')}
        </button>
      </div>
    </div>
  );
};

/** Announces each route change to screen readers. */
const RouteAnnouncer: React.FC = () => {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Deferred so the live region updates after the new page has mounted.
    const id = window.setTimeout(() => setMessage(`${t('common.loaded')} ${pathname}`), 120);
    return () => window.clearTimeout(id);
  }, [pathname, t]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // The "more" sheet holds everything the bottom tab bar does not.
  const [moreOpen, setMoreOpen] = useState(false);

  // Navigating away always dismisses the sheet.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const activeTab = location.pathname.startsWith('/dashboard')
    ? 'dashboard'
    : location.pathname.startsWith('/groups')
      ? 'groups'
      : location.pathname.startsWith('/payments')
        ? 'payments'
        : location.pathname.startsWith('/search')
          ? 'search'
          : location.pathname.startsWith('/profile')
            ? 'profile'
            : '';

  return (
    <>
      <ScrollToTop />
      <ThemeSync />
      {/* Desktop island navbar (lg and up) */}
      <Navbar />
      {/* Mobile top bar: replaces desktop island on small screens */}
      <MobileTopBar onToggleMenu={() => setMoreOpen((v) => !v)} menuOpen={moreOpen} />
      <CalendarChooser />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/groups" element={
          <ProtectedRoute><GroupsPage /></ProtectedRoute>
        } />
        <Route path="/groups/new" element={
          <ProtectedRoute><GroupCreatePage /></ProtectedRoute>
        } />
        <Route path="/groups/:id" element={
          <ProtectedRoute><GroupDetailPage /></ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute><PaymentsPage /></ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute><SearchPage /></ProtectedRoute>
        } />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-to" element={<HowToPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Unknown routes: send people somewhere real */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: 'rgb(var(--c-surface))',
            color: 'rgb(var(--c-ink))',
            border: '1px solid rgb(var(--c-line))',
            fontSize: '14px',
            fontFamily: '"Outfit Variable", sans-serif',
            boxShadow: '0 12px 32px -12px rgba(0,0,0,0.25)',
          },
          success: { iconTheme: { primary: 'rgb(var(--c-success))', secondary: '#fff' } },
          error: { iconTheme: { primary: 'rgb(var(--c-accent))', secondary: 'rgb(var(--c-accent-ink))' } },
        }}
      />
      <PwaUpdateBanner />
      <InstallPromptBanner />
      {/* Mobile app chrome: bottom tab bar + the "more" sheet */}
      <MobileTabBar active={activeTab} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      {/* Screen-reader route announcements */}
      <RouteAnnouncer />
    </>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <Router>
      <AppRoutes />
    </Router>
  </Provider>
);

export default App;
