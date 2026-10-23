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
 * - Active indicator with scaled-up icon + accent colour
 * - Clicks navigate via react-router-dom Link
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
      className="app-tabbar fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around border-t border-line/80 bg-surface/95 px-1 pt-1.5 backdrop-blur-xl lg:hidden"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            onClick={() => onSelect?.(tab.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-colors ${
              isActive
                ? 'text-accent'
                : 'text-muted hover:text-ink'
            }`}
          >
            <tab.Icon
              size={22}
              weight={isActive ? 'fill' : 'regular'}
              className={isActive ? 'scale-110 transition-transform' : undefined}
            />
            <span className="max-w-full truncate text-[10px] font-medium uppercase tracking-wide">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileTabBar;
