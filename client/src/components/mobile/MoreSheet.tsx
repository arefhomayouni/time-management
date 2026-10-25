import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarBlank,
  CalendarCheck,
  Coins,
  CurrencyCircleDollar,
  EnvelopeSimple,
  GlobeHemisphereEast,
  Hexagon,
  Desktop,
  Moon,
  SignOut,
  Sun,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import {
  cycleTheme,
  openCalendarAsk,
  cycleCurrency,
} from '../../store/slices/uiSlice';
import { useLanguage } from '../../hooks/useLanguage';
import BottomSheet from './BottomSheet';
import LogTimeForm from '../dashboard/LogTimeForm';

type MoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * The "more" sheet for the mobile app chrome.
 *
 * The bottom tab bar only carries the five primary destinations, so
 * everything else lives here: a quick "log time" form, the secondary
 * pages, the display/currency/calendar switches and the auth actions.
 */
const MoreSheet: React.FC<MoreSheetProps> = ({ open, onClose }) => {
  const { t, language, setLanguage } = useLanguage();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.ui.theme);
  const resolvedTheme = useAppSelector((s) => s.ui.resolvedTheme);
  const currency = useAppSelector((s) => s.ui.currency);
  const calendar = useAppSelector((s) => s.ui.calendar);

  const handleLogout = () => {
    dispatch(logout());
    toast.success(t('nav.signed_out'));
    onClose();
    navigate('/');
  };

  const secondaryLinks = [
    { to: '/about', label: t('nav.about'), Icon: Hexagon },
    { to: '/how-to', label: t('nav.how_to'), Icon: ArrowRight },
    { to: '/contact', label: t('nav.contact'), Icon: EnvelopeSimple },
  ];

  const switchButton = (
    label: string,
    value: string,
    onClick: () => void,
    Icon: React.ElementType
  ) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-inset"
    >
      <Icon size={17} className="text-muted" />
      <span className="truncate text-muted">{label}</span>
      <span className="ms-auto truncate text-xs font-medium text-ink">{value}</span>
    </button>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={t('nav.more')} id="more-sheet">
      <div className="space-y-6 pb-2">
        {/* Quick log - only for signed-in users */}
        {user && (
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              {t('dashboard.log_time')}
            </h3>
            <LogTimeForm onSaved={onClose} />
          </section>
        )}

        {/* Secondary pages */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('nav.more')}
          </h3>
          <div className="space-y-1">
            {secondaryLinks.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-inset/60 hover:text-ink"
              >
                <Icon size={18} />
                <span>{label}</span>
                <ArrowRight size={15} className="ms-auto rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </section>

        {/* Display switches */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('nav.settings')}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {switchButton(
              t('nav.toggle_theme'),
              theme === 'system'
                ? t('common.system')
                : resolvedTheme === 'dark'
                  ? t('common.dark')
                  : t('common.light'),
              () => dispatch(cycleTheme()),
              theme === 'system' ? Desktop : resolvedTheme === 'dark' ? Sun : Moon
            )}
            {switchButton(
              t('nav.change_language'),
              language === 'fa' ? 'فارسی' : 'English',
              () => setLanguage(language === 'fa' ? 'en' : 'fa'),
              GlobeHemisphereEast
            )}
            {switchButton(
              t('currency.change'),
              currency === 'dual'
                ? t('currency.dual')
                : currency === 'usd'
                  ? t('currency.usd')
                  : t('currency.irr'),
              () => dispatch(cycleCurrency()),
              currency === 'irr' ? Coins : CurrencyCircleDollar
            )}
            {switchButton(
              t('calendar.navbar_title'),
              calendar === 'jalali' ? t('calendar.jalali') : t('calendar.gregorian'),
              () => dispatch(openCalendarAsk()),
              calendar === 'jalali' ? CalendarCheck : CalendarBlank
            )}
          </div>
        </section>

        {/* Auth */}
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-inset/60 hover:text-accent"
          >
            <SignOut size={18} />
            <span>{t('common.logout')}</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/login"
              onClick={onClose}
              className="btn-ghost flex-1 justify-center !py-2.5 text-sm"
            >
              {t('auth.login_btn')}
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="btn-primary flex-1 justify-center !py-2.5 text-sm shadow-[0_6px_18px_-6px_rgb(var(--c-glow)/0.5)]"
            >
              {t('nav.start_free')}
            </Link>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default MoreSheet;
