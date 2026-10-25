import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChartLineUp,
  UsersThree,
  Wallet,
  SignOut,
  GlobeHemisphereEast,
  Sun,
  Moon,
  Desktop,
  CurrencyCircleDollar,
  Coins,
  Hexagon,
  ArrowRight,
  EnvelopeSimple,
  CalendarBlank,
  CalendarCheck,
  List,
  X,
  UserCircle,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  cycleTheme,
  cycleCurrency,
  openCalendarAsk,
} from '../store/slices/uiSlice';
import { useLanguage } from '../hooks/useLanguage';
import toast from 'react-hot-toast';

const BRAND = process.env.REACT_APP_BRAND || 'TimeLuxe';

/**
 * Floating island navbar: a rounded glass pill that detaches from the top
 * edge (sits at top-4), casts a soft shadow, and contains all controls.
 * Signed-out: brand + CTA buttons centered. Signed-in: brand left, links
 * centered, controls right.
 *
 * Motions: opacity + translateY entry on mount; backdrop-blur only on the
 * fixed island (never on scroll containers).
 */
const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.ui.theme);
  const resolvedTheme = useAppSelector((s) => s.ui.resolvedTheme);
  const currency = useAppSelector((s) => s.ui.currency);
  const calendar = useAppSelector((s) => s.ui.calendar);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Close the mobile menu on navigation or Escape.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success(t('nav.signed_out'));
    navigate('/');
  };

  const navLink = (to: string, label: string, Icon: React.ComponentType<any>) => {
    const active = location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-accent/10 text-accent shadow-[0_0_0_1px_rgb(var(--c-accent)/0.15)]'
            : 'text-muted hover:text-ink hover:bg-inset/60'
        }`}
      >
        <Icon size={17} weight={active ? 'fill' : 'regular'} />
        <span className="hidden xl:inline">{label}</span>
      </Link>
    );
  };

  /** Full-width row used inside the mobile menu (label always visible). */
  const menuLink = (to: string, label: string, Icon: React.ComponentType<any>) => {
    const active = location.pathname.startsWith(to);
    return (
      <Link
        key={to}
        to={to}
        onClick={() => setMenuOpen(false)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? 'bg-accent/10 text-accent shadow-[0_0_0_1px_rgb(var(--c-accent)/0.15)]'
            : 'text-muted hover:bg-inset/60 hover:text-ink'
        }`}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} />
        <span>{label}</span>
      </Link>
    );
  };

  // On mount, fade in. Only once. State (not a ref) so the class flips
  // and re-renders, otherwise the pill stays at opacity-0 after a hard load.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setEntered(true);
  }, []);

  return (
    <>
      {/* Scrim behind the mobile menu (below the island, above the page) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="nav-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
            aria-hidden
          />
        )}
      </AnimatePresence>

    <header
      className="navbar-island hidden lg:block"
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        className={`flex h-14 w-auto max-w-shell items-center gap-2 rounded-2xl bg-surface/90 px-3 backdrop-blur-xl shadow-[0_8px_28px_-8px_rgb(0,0,0,0.12),0_2px_8px_-4px_rgb(0,0,0,0.06)]          border border-line/80 transition-all duration-300 sm:gap-3 sm:px-6 ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Brand: clay square mark + wordmark */}
        <Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-ink shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.5)]">
            <Hexagon size={18} weight="bold" className="text-accent-ink" />
          </span>
          <span className="hidden whitespace-nowrap text-[15px] font-semibold tracking-tight xl:inline">{BRAND}</span>
        </Link>

        {/* Divider for signed-in */}
        {user && <div className="mx-1 hidden h-5 w-px bg-line/60 lg:block" />}

        {/* App links (signed in only) - centered */}
        {user && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {navLink('/dashboard', t('nav.dashboard'), ChartLineUp)}
            {navLink('/groups', t('nav.groups'), UsersThree)}
            {navLink('/payments', t('nav.payments'), Wallet)}
            {navLink('/search', t('nav.search'), MagnifyingGlass)}
            {navLink('/about', t('nav.about'), Hexagon)}
            {navLink('/how-to', t('nav.how_to'), ArrowRight)}
            {navLink('/contact', t('nav.contact'), EnvelopeSimple)}
          </nav>
        )}

        {/* Right cluster: controls + user */}
        <div className="flex items-center gap-1.5">
          {/* Language */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            title={language === 'en' ? 'فارسی' : 'English'}
            aria-label={t('nav.change_language')}
          >
            <GlobeHemisphereEast size={17} />
          </button>

          {/* Theme: cycles system -> light -> dark */}
          <button
            onClick={() => dispatch(cycleTheme())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            aria-label={`${t('nav.toggle_theme')}: ${t(
              theme === 'system'
                ? 'common.system'
                : theme === 'dark'
                  ? 'common.dark'
                  : 'common.light'
            )}`}
            title={t(
              theme === 'system'
                ? 'common.system'
                : theme === 'dark'
                  ? 'common.dark'
                  : 'common.light'
            )}
          >
            {theme === 'system' ? (
              <Desktop size={17} />
            ) : resolvedTheme === 'dark' ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>

          {/* Calendar: open the Persian / Gregorian chooser */}
          <button
            onClick={() => dispatch(openCalendarAsk())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            title={t(
              calendar === 'jalali'
                ? 'calendar.navbar_current_jalali'
                : 'calendar.navbar_current_gregorian'
            )}
            aria-label={`${t('calendar.navbar_title')}: ${t(
              calendar === 'jalali' ? 'calendar.jalali' : 'calendar.gregorian'
            )}`}
          >
            {calendar === 'jalali' ? (
              <CalendarCheck size={17} />
            ) : (
              <CalendarBlank size={17} />
            )}
          </button>

          {/* Currency */}
          <button
            onClick={() => dispatch(cycleCurrency())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            title={t(
              currency === 'dual'
                ? 'currency.dual'
                : currency === 'usd'
                  ? 'currency.usd'
                  : 'currency.irr'
            )}
            aria-label={t('currency.change')}
          >
            {currency === 'dual' ? (
              <CurrencyCircleDollar size={17} weight="fill" />
            ) : currency === 'usd' ? (
              <CurrencyCircleDollar size={17} />
            ) : (
              <Coins size={17} />
            )}
          </button>

          {user ? (
            <>
              {/* User pill: avatar initial + name, inline */}
              <Link
                to="/profile"
                className="ml-1 flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-inset hover:text-ink sm:px-2.5"
                title={t('nav.profile')}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent ring-1 ring-accent/20">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[110px] truncate text-sm font-medium md:inline">
                  {user.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-accent sm:block"
                aria-label={t('common.logout')}
                title={t('common.logout')}
              >
                <SignOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden !py-2 !px-4 text-sm lg:inline-flex">
                {t('auth.login_btn')}
              </Link>
              <Link to="/register" className="btn-primary hidden !py-2 !px-4 text-sm shadow-[0_6px_18px_-6px_rgb(var(--c-glow)/0.5)] lg:inline-flex">
                {t('nav.start_free')}
              </Link>
            </>
          )}

          {/* Mobile: hamburger opens the menu panel below */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel: anchored under the island, staggered entrance */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="nav-panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-2xl border border-line/80 bg-surface/95 p-2 shadow-[0_20px_48px_-16px_rgb(0,0,0,0.35)] backdrop-blur-xl lg:hidden"
          >
            <motion.div
              className="flex flex-col gap-0.5"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.03 } },
              }}
            >
              {user ? (
                <>
                  {[
                    ['/dashboard', t('nav.dashboard'), ChartLineUp],
                    ['/groups', t('nav.groups'), UsersThree],
                    ['/payments', t('nav.payments'), Wallet],
                    ['/search', t('nav.search'), MagnifyingGlass],
                    ['/about', t('nav.about'), Hexagon],
                    ['/how-to', t('nav.how_to'), ArrowRight],
                    ['/contact', t('nav.contact'), EnvelopeSimple],
                    ['/profile', t('nav.profile'), UserCircle],
                  ].map(([to, label, Icon]) => (
                    <motion.div
                      key={to as string}
                      variants={{
                        hidden: { opacity: 0, y: -6 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      {menuLink(to as string, label as string, Icon as React.ComponentType<any>)}
                    </motion.div>
                  ))}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } }}
                    className="my-1 h-px bg-line/70"
                  />
                  <motion.button
                    variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } }}
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-inset/60 hover:text-accent"
                  >
                    <SignOut size={18} />
                    <span>{t('common.logout')}</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } }}
                    className="flex gap-2 p-1"
                  >
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="btn-ghost flex-1 justify-center !py-2.5 text-sm"
                    >
                      {t('auth.login_btn')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="btn-primary flex-1 justify-center !py-2.5 text-sm shadow-[0_6px_18px_-6px_rgb(var(--c-glow)/0.5)]"
                    >
                      {t('nav.start_free')}
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
};

export default Navbar;
