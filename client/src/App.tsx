import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from 'react-hot-toast';
import { useAppSelector } from './store/hooks';
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

/** Scrolls to top on every navigation */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/** Keeps <html class="dark"> and lang/dir in sync with the ui slice */
const ThemeSync: React.FC = () => {
  const theme = useAppSelector((s) => s.ui.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
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

const AppRoutes: React.FC = () => {
  const { t } = useLanguage();
  return (
    <>
      <ScrollToTop />
      <ThemeSync />
      <Navbar />
      <CalendarChooser />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
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
      {/* Screen-reader route announcements */}
      <div aria-live="polite" className="sr-only">{t('common.loaded')}</div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  );
};

export default App;
