import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X, MagnifyingGlass } from '@phosphor-icons/react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAppSelector } from '../../store/hooks';

type MobileTopBarProps = {
  onToggleMenu: () => void;
  /** Whether the more-sheet is currently open (drives the icon + aria state). */
  menuOpen?: boolean;
};

/**
 * Route -> compact title shown in the mobile app bar. Keeping the title
 * contextual (rather than just the brand) is what makes the installed PWA
 * feel like a real app: you always know which screen you are on.
 */
const titleFor = (pathname: string, t: (k: string) => string): string => {
  if (pathname.startsWith('/dashboard')) return t('nav.dashboard');
  if (pathname.startsWith('/groups/new')) return t('groups.create_btn');
  if (pathname.startsWith('/groups')) return t('nav.groups');
  if (pathname.startsWith('/payments')) return t('nav.payments');
  if (pathname.startsWith('/search')) return t('nav.search');
  if (pathname.startsWith('/profile')) return t('nav.profile');
  if (pathname.startsWith('/about')) return t('nav.about');
  if (pathname.startsWith('/how-to')) return t('nav.how_to');
  if (pathname.startsWith('/contact')) return t('nav.contact');
  return process.env.REACT_APP_BRAND || 'TimeLuxe';
};

/**
 * Fixed top bar that replaces the desktop island navbar on mobile.
 * - Contextual page title (centered) so the installed app always shows where
 *   you are; the brand mark on the left acts as a home shortcut.
 * - Menu button on the right that toggles the full-page sheet.
 * - Safe-area top inset so it doesn't overlay the notch/home-indicator.
 */
const MobileTopBar: React.FC<MobileTopBarProps> = ({ onToggleMenu, menuOpen = false }) => {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const signedIn = useAppSelector((s) => Boolean(s.auth.user));
  const title = titleFor(pathname, t);
  // The brand mark is a home shortcut for its own audience: the dashboard when
  // signed in, the landing page when not. Language must never change where it
  // goes, so it is not part of this decision.
  const brandHref = signedIn ? '/dashboard' : '/';

  return (
    <header className="app-topbar fixed top-0 left-0 right-0 z-50 border-b border-line/80 bg-surface/90 px-3 py-2 backdrop-blur-xl lg:hidden">
      <div className="flex w-full max-w-shell items-center justify-between gap-2">
        {/* Brand / home on the left */}
        <Link
          to={brandHref}
          className="tap-target flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"
          aria-label={process.env.REACT_APP_BRAND || 'TimeLuxe'}
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent text-accent-ink">
            <span className="text-[13px] font-bold leading-none">
              {(process.env.REACT_APP_BRAND || 'T').slice(0, 1)}
            </span>
          </span>
        </Link>

        {/* Contextual page title. Deliberately NOT a heading: the page itself
            renders the real <h1>, so a second one here would be a duplicate
            for screen readers and would split the document outline. */}
        <span className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold tracking-tight text-ink">
          {title}
        </span>

        {/* Right cluster: search shortcut + menu */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/search"
            className="tap-target grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-inset hover:text-ink"
            aria-label={t('nav.search')}
          >
            <MagnifyingGlass size={18} />
          </Link>
          <button
            type="button"
            onClick={onToggleMenu}
            className="tap-target grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-inset hover:text-ink"
            aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
            aria-expanded={menuOpen}
            aria-controls="more-sheet"
          >
            {menuOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileTopBar;
