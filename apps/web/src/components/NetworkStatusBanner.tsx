'use client';

import React, { useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isLowBandwidth: boolean;
  wasOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    // Detect low-bandwidth connection
    const nav = navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
        addEventListener?: (type: string, listener: () => void) => void;
      };
    };

    function checkConnection() {
      if (nav.connection) {
        const is2G =
          nav.connection.effectiveType === '2g' || nav.connection.effectiveType === 'slow-2g';
        const isDataSaver = nav.connection.saveData === true;
        setIsLowBandwidth(is2G || isDataSaver);
      }
    }

    checkConnection();
    nav.connection?.addEventListener?.('change', checkConnection);

    function handleOnline() {
      setIsOnline(true);
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOnline(false);
      setWasOffline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isLowBandwidth, wasOffline };
}

export function NetworkStatusBanner() {
  const { isOnline, isLowBandwidth, wasOffline } = useNetworkStatus();

  // 1. Connection Restored Banner
  if (isOnline && wasOffline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-[#1e4635] text-white px-4 py-2 text-xs sm:text-sm font-medium border-b border-[#2d634d] flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <svg
          className="w-4 h-4 text-[#8fe3b6] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>
          <strong>Back online.</strong> Live government data and portal updates are now synced.
        </span>
      </aside>
    );
  }

  // 2. Offline Banner (Per DESIGN.md Section 63)
  if (!isOnline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-[#5c3807] text-[#fff9eb] px-4 py-2.5 text-xs sm:text-sm border-b-2 border-[#87530c] shadow-sm flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          {/* Offline Icon */}
          <svg
            className="w-4 h-4 text-[#ffc875] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-2.828m0 0L3 21m2.636-15.364a9 9 0 0112.728 0M3 3l18 18"
            />
          </svg>
          <span>
            <strong>You are currently offline.</strong> Showing saved information. Your progress and
            documents remain preserved locally.
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="underline hover:no-underline font-semibold text-xs sm:text-sm cursor-pointer ml-auto shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        >
          Retry Connection
        </button>
      </aside>
    );
  }

  // 3. Low-Bandwidth Mode Indicator (Subtle, non-intrusive)
  if (isLowBandwidth) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-[#0d2a3d] text-[#e3f0f7] px-4 py-1.5 text-xs border-b border-[#1b4b6b] flex items-center justify-center gap-2"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-[#52c1f7]" aria-hidden="true" />
        <span>
          <strong>Low-bandwidth mode active.</strong> Data-saving enabled; using cached resources
          where available.
        </span>
      </aside>
    );
  }

  return null;
}
