import { useEffect, useState } from 'react';

/**
 * Tracks whether the viewport is below the `lg` breakpoint (1024px), which
 * is where the app swaps the desktop island navbar for the mobile chrome
 * (top bar + tab bar). Uses matchMedia so it responds live to rotation and
 * window resizing without a resize-listener loop.
 *
 * Defaults to `false` (desktop) before mount to avoid a first-paint flash of
 * the mobile layout on wide screens.
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
