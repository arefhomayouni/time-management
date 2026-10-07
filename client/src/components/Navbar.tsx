import React from 'react';
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
} from '@phosphor-icons/react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { toggleTheme, cycleCurrency } from '../store/slices/uiSlice';
import { useLanguage } from '../hooks/useLanguage';
import toast from 'react-hot-toast';

const BRAND = process.env.REACT_APP_BRAND || 'TimeLuxe';

/**
 * One nav for the whole app:
 *  - signed out: marketing variant (brand + theme + lang + Sign in / Start free)
 *  - signed in: app variant (brand + section links + controls + user + sign out)
 * Fixed height 64px, always a single row on desktop.
 */
const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.ui.theme);
  const currency = useAppSelector((s) => s.ui.currency);

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
        className={`flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition-colors sm:px-3 ${
          active ? 'bg-inset text-ink' : 'text-muted hover:text-ink'
        }`}
      >
        <Icon size={17} weight={active ? 'fill' : 'regular'} />
        <span className="hidden lg:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-ink">
            <span className="text-sm font-bold leading-none">T</span>
          </span>
          <span className="text-[17px] font-semibold tracking-tight sm:inline hidden">{BRAND}</span>
        </Link>

        {/* App links (signed in only) */}
        {user && (
          <nav className="flex items-center gap-1" aria-label="Main">
            {navLink('/dashboard', t('nav.dashboard'), ChartLineUp)}
            {navLink('/groups', t('nav.groups'), UsersThree)}
            {navLink('/payments', t('nav.payments'), Wallet)}
          </nav>
        )}

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            title={language === 'en' ? 'فارسی' : 'English'}
            aria-label={t('nav.change_language')}
          >
            <GlobeHemisphereEast size={18} />
          </button>
          <button
            onClick={() => dispatch(toggleTheme())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            aria-label={t('nav.toggle_theme')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => dispatch(cycleCurrency())}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
            title={currency === 'dual' ? 'USD + IRR' : currency === 'usd' ? 'USD' : 'IRR'}
            aria-label="Change currency"
          >
            {currency === 'dual' ? <CurrencyCircleDollar size={18} /> : currency === 'usd' ? <CurrencyCircleDollar size={18} /> : <Coins size={18} />}
          </button>

          {user ? (
            <>
              <Link
                to="/profile"
                className="ml-1 hidden items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-inset sm:flex"
                title={t('nav.profile')}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
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
                <SignOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !py-2">
                {t('auth.login_btn')}
              </Link>
              <Link to="/register" className="btn-primary !py-2">
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
