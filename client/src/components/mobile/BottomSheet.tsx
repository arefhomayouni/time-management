import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useLanguage } from '../../hooks/useLanguage';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Optional heading; rendered with a close button in the drag handle row. */
  title?: string;
  children: React.ReactNode;
  /** Extra classes for the panel (height caps, padding tweaks). */
  className?: string;
  /** id for the panel, so triggers can point at it with aria-controls. */
  id?: string;
};

/**
 * Mobile-first bottom sheet.
 *
 * - Rises from the bottom with a spring, dismisses via scrim tap, Escape,
 *   the close button, or dragging the handle down past a threshold.
 * - Only the handle row starts a drag, so the sheet body can still scroll
 *   freely on touch devices.
 * - Locks page scroll while open, moves focus into the panel, and renders
 *   in a portal so it is never clipped by page containers.
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  className = '',
  id,
}) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Freeze the page behind the sheet.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus lands on the panel so screen readers announce the dialog.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[80]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 h-full w-full cursor-default bg-black/55 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            id={id}
            tabIndex={-1}
            drag={reduce ? false : 'y'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={handleDragEnd}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            className={`sheet-safe absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-line bg-surface shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.55)] focus:outline-none ${className}`}
          >
            {/* Handle + title: the drag surface */}
            <div
              onPointerDown={(e) => {
                if (!reduce) dragControls.start(e);
              }}
              className="cursor-grab touch-none select-none"
            >
              <div className="flex justify-center pb-1 pt-3">
                <span className="h-1.5 w-10 rounded-full bg-line" />
              </div>
              {title && (
                <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-2">
                  <h2 className="text-base font-semibold tracking-tight text-ink">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('common.close')}
                    className="-me-2 rounded-xl p-2 text-muted transition-colors hover:bg-inset hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 pt-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BottomSheet;
