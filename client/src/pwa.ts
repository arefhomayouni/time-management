/**
 * PWA service worker registration.
 *
 * Registers `public/sw.js` in production only: in development the worker
 * would cache the CRA dev bundle and fight hot reload.
 *
 * When a new build is installed while the app is open, we broadcast
 * `timeluxe:pwa-update` so the UI can offer a one-click reload.
 */

export const PWA_UPDATE_EVENT = 'timeluxe:pwa-update';

export type PwaUpdateDetail = {
  /** Activate the waiting worker and reload onto the new build. */
  apply: () => void;
};

const isSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof navigator.serviceWorker !== 'undefined';

/** Subscribe to update availability. Returns an unsubscribe function. */
export const onPwaUpdate = (handler: (detail: PwaUpdateDetail) => void) => {
  const listener = (event: Event) => handler((event as CustomEvent<PwaUpdateDetail>).detail);
  window.addEventListener(PWA_UPDATE_EVENT, listener);
  return () => window.removeEventListener(PWA_UPDATE_EVENT, listener);
};

let registered = false;

export const registerServiceWorker = () => {
  if (registered || !isSupported) return;
  if (process.env.NODE_ENV !== 'production') return;
  registered = true;

  const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;

  const start = () => {
    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .then((registration) => {
        // A worker from an earlier visit may already be waiting.
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state !== 'installed') return;
            // No controller means this is the first install, not an update.
            if (!navigator.serviceWorker.controller) return;
            promptUpdate(installing);
          });
        });
      })
      .catch((error) => {
        // A failed registration must never break the app.
        // eslint-disable-next-line no-console
        console.warn('[pwa] service worker registration failed', error);
      });
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
};

function promptUpdate(worker: ServiceWorker) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const apply = () => {
    worker.postMessage('SKIP_WAITING');
    // Fallback for browsers that never fire controllerchange.
    window.setTimeout(() => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    }, 1500);
  };

  window.dispatchEvent(
    new CustomEvent<PwaUpdateDetail>(PWA_UPDATE_EVENT, { detail: { apply } })
  );
}
