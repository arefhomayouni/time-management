import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChartLineUp,
  MagnifyingGlass,
  UserCircle,
  UsersThree,
  Wallet,
} from '@phosphor-icons/react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAppSelector } from '../../store/hooks';

type MobileTabBarProps = {
  /** Currently selected tab key. */
  active: string;
  /** Called when the user selects a different tab. */
  onSelect?: (key: string) => void;
};

/**
 * Fixed bottom tab bar for the installed/PWA experience.
 * - 5 tab destinations, all of which require an account
 * - Active indicator: accent colour + a pill behind the icon so the current
 *   tab is obvious at a glance (and under sunlight on a job site)
 * - 44px+ touch targets via the icon+label column height
 * - Safe-area bottom inset so it never overlaps content
 *
 * Signed-out visitors never see it: every tab would bounce them to /login,
 * and the marketing pages end in a footer the fixed bar would cover.
 */
const MobileTabBar: React.FC<MobileTabBarProps> = ({ active, onSelect }) => {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  const tabs = [
    { key: 'dashboard', to: '/dashboard', label: t('nav.dashboard'), Icon: ChartLineUp },
    { key: 'groups', to: '/groups', label: t('nav.groups'), Icon: UsersThree },
    { key: 'payments', to: '/payments', label: t('nav.payments'), Icon: Wallet },
    { key: 'search', to: '/search', label: t('nav.search'), Icon: MagnifyingGlass },
    { key: 'profile', to: '/profile', label: t('nav.profile'), Icon: UserCircle },
  ];

  return (
    <nav
      aria-label={t('nav.menu')}
      className="app-tabbar fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around border-t border-line/80 bg-surface/95 px-1 pt-1 backdrop-blur-xl lg:hidden"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            onClick={() => onSelect?.(tab.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors ${
              isActive ? 'text-accent' : 'text-muted hover:text-ink'
            }`}
          >
            {/* Active pill behind the icon for a stronger current-tab signal */}
            <span
              className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${
                isActive ? 'bg-accent/12' : ''
              }`}
            >
              <tab.Icon size={20} weight={isActive ? 'fill' : 'regular'} />
            </span>
            <span
              className={`max-w-full truncate px-0.5 text-[10px] leading-tight ${
                isActive ? 'font-semibold' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileTabBar;
