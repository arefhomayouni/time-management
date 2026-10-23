import React from 'react';
import { Link } from 'react-router-dom';
import { List, Hexagon, X } from '@phosphor-icons/react';
import { useLanguage } from '../../hooks/useLanguage';

type MobileTopBarProps = {
  onToggleMenu: () => void;
  /** Whether the more-sheet is currently open (drives the icon + aria state). */
  menuOpen?: boolean;
};

/**
 * Fixed top bar that replaces the desktop island navbar on mobile.
 * - Brand on the left
 * - Menu button on the right that toggles the full-page sheet
 * - Safe-area top inset so it doesn't overlay the notch/home-indicator
 */
const MobileTopBar: React.FC<MobileTopBarProps> = ({ onToggleMenu, menuOpen = false }) => {
  const { t, language } = useLanguage();

  return (
    <header className="app-topbar fixed top-0 left-0 right-0 z-50 border-b border-line/80 bg-surface/90 px-4 py-2 backdrop-blur-xl lg:hidden">
      <div className="flex w-full max-w-shell items-center justify-between">
        {/* Brand left */}
        <Link
          to={language === 'fa' ? '/dashboard' : '/'}
          className="flex items-center gap-2.5"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-ink shadow-[0_4px_12px_-4px_rgb(var(--c-glow)/0.5)]">
            <Hexagon size={18} weight="bold" className="text-accent-ink" />
          </span>
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight">
            {process.env.REACT_APP_BRAND || 'TimeLuxe'}
          </span>
        </Link>

        {/* Menu toggle: opens the more-sheet */}
        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
          aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
          aria-expanded={menuOpen}
          aria-controls="more-sheet"
        >
          {menuOpen ? <X size={18} /> : <List size={18} />}
        </button>
      </div>
    </header>
  );
};

export default MobileTopBar;
