import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChartLineUp,
  UsersThree,
  Wallet,
  SignOut,
  GlobeHemisphereEast,
  Sun,
  Moon,
  CurrencyCircleDollar,
  Coins,
  Hexagon,
  ArrowRight,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { toggleTheme, cycleCurrency } from '../store/slices/uiSlice';
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
  const currency = useAppSelector((s) => s.ui.currency);
  const mountedRef = useRef(false);

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
        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-accent/10 text-accent shadow-[0_0_0_1px_rgb(var(--c-accent)/0.15)]'
            : 'text-muted hover:text-ink hover:bg-inset/60'
        }`}
      >
        <Icon size={17} weight={active ? 'fill' : 'regular'} />
        <span className="hidden lg:inline">{label}</span>
      </Link>
    );
  };

  // On mount, fade in. Only once.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
    }
  }, []);

  return (
    <header
      className="navbar-island"
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        className={`flex h-14 w-auto max-w-shell items-center gap-3 rounded-2xl bg-surface/90 px-4 backdrop-blur-xl shadow-[0_8px_28px_-8px_rgb(0,0,0,0.12),0_2px_8px_-4px_rgb(0,0,0,0.06)] border border-line/80 transition-all duration-300 sm:px-6 ${
          mountedRef.current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Brand: clay square mark + wordmark */}
        <Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-ink shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.5)]">
            <Hexagon size={18} weight="bold" className="text-accent-ink" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight sm:inline hidden">{BRAND}</span>
        </Link>

        {/* Divider for signed-in */}
        {user && <div className="mx-1 h-5 w-px bg-line/60" />}

        {/* App links (signed in only) — centered */}
        {user && (
          <nav className="flex items-center gap-1" aria-label="Main">
            {navLink('/dashboard', t('nav.dashboard'), ChartLineUp)}
            {navLink('/groups', t('nav.groups'), UsersThree)}
            {navLink('/payments', t('nav.payments'), Wallet)}
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

          {/* Theme */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            aria-label={t('nav.toggle_theme')}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Currency */}
          <button
            onClick={() => dispatch(cycleCurrency())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            title={currency === 'dual' ? 'USD + IRR' : currency === 'usd' ? 'USD' : 'IRR'}
            aria-label="Change currency"
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
                className="ml-1 flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-inset hover:text-ink"
                title={t('nav.profile')}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent ring-1 ring-accent/20">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate text-sm font-medium">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-accent"
                aria-label={t('common.logout')}
                title={t('common.logout')}
              >
                <SignOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">
                {t('auth.login_btn')}
              </Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 text-sm shadow-[0_6px_18px_-6px_rgb(var(--c-glow)/0.5)]">
                {t('nav.start_free')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
