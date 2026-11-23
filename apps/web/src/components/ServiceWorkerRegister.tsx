'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister
 * Safely registers the PWA service worker in the browser environment.
 * Complies with DESIGN.md Section 117 (PWA Experience) and Section 63 (Offline/Slow Network UX).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Only register in production or when service worker is supported
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check if an update was found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available; post message to activate
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      } catch {
        // Silently tolerate service worker registration failure in sandboxed or unsupported environments
      }
    };

    const handleLoad = () => {
      void register();
    };

    // Defer registration until window load to prioritize main-thread interactivity
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return null;
}
