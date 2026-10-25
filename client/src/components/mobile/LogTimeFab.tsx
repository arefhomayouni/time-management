import React, { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAppSelector } from '../../store/hooks';
import BottomSheet from './BottomSheet';
import LogTimeForm from '../dashboard/LogTimeForm';

/**
 * Mobile "log time" entry point.
 *
 * On a phone the inline Dashboard form eats a third of the screen, so the
 * primary daily action becomes a thumb-reachable FAB that raises a
 * swipe-to-dismiss bottom sheet. The same LogTimeForm is reused, so both
 * paths submit identically.
 *
 * Rendered only for signed-in users and hidden on desktop (CSS `lg:hidden`
 * via the .fab rule), where the inline card stays the primary path.
 */
const LogTimeFab: React.FC = () => {
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fab"
        aria-label={t('dashboard.log_time')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="log-time-sheet"
      >
        <Plus size={20} weight="bold" />
        <span>{t('dashboard.log_time')}</span>
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('dashboard.log_time')}
        id="log-time-sheet"
        className="log-sheet"
      >
        <LogTimeForm onSaved={() => setOpen(false)} className="pb-2" />
      </BottomSheet>
    </>
  );
};

export default LogTimeFab;
