import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { X } from '@phosphor-icons/react';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { syncSystemTheme } from './store/slices/uiSlice';
import { useLanguage } from './hooks/useLanguage';
import { onPwaUpdate } from './pwa';
import Navbar from './components/Navbar';
import Toaster from './components/ui/Toaster';
import InstallPrompt from './components/pwa/InstallPrompt';
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

/**
 * Offers a reload when the service worker installs a newer build.
 * Sits in the same bottom stack as toasts but above the mobile tab bar, so it
 * never covers the navigation or the home indicator.
 */
const PwaUpdateBanner: React.FC = () => {
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => onPwaUpdate(({ apply }) => setApplyUpdate(() => apply)), []);

  if (!applyUpdate || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(var(--mobile-tabbar-h)+1rem+env(safe-area-inset-bottom,0px))] z-[70] flex justify-center px-4 lg:bottom-6">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line/70 bg-surface/95 p-3.5 shadow-[0_18px_44px_-18px_rgba(24,16,10,0.38)] backdrop-blur-xl lg:max-w-md">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug text-ink">
            A new version is ready
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Reload to pick up the latest update.
          </p>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          className="btn-primary !px-3.5 !py-1.5 text-xs"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-inset hover:text-ink"
        >
          <X size={14} weight="bold" />
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
      <Toaster />
      <PwaUpdateBanner />
      <InstallPrompt />
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
