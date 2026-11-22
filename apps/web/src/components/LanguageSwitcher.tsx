'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SupportedLanguage } from '@janasahayak/types';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
];

export interface LanguageSwitcherProps {
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  className?: string;
  compact?: boolean;
}

function LanguageSwitcherContent({
  currentLanguage: propLanguage,
  onLanguageChange,
  className = '',
  compact = false,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeLang, setActiveLang] = useState<SupportedLanguage>(() => {
    if (propLanguage) return propLanguage;
    return 'en';
  });

  // Sync with URL parameter and localStorage on client mount
  useEffect(() => {
    const urlLang = searchParams?.get('lang') as SupportedLanguage | null;
    const storedLang = (
      typeof window !== 'undefined' ? localStorage.getItem('janasahayak_language') : null
    ) as SupportedLanguage | null;

    const initial =
      urlLang && (urlLang === 'en' || urlLang === 'hi' || urlLang === 'kn')
        ? urlLang
        : storedLang && (storedLang === 'en' || storedLang === 'hi' || storedLang === 'kn')
          ? storedLang
          : propLanguage || 'en';

    setActiveLang(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }
  }, [searchParams, propLanguage]);

  const handleSelect = (lang: SupportedLanguage) => {
    setActiveLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('janasahayak_language', lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new CustomEvent('janasahayak-language-change', { detail: { lang } }));
    }

    if (onLanguageChange) {
      onLanguageChange(lang);
    }

    // Update URL query parameter without losing other params
    if (pathname && searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      if (lang === 'en') {
        params.delete('lang');
      } else {
        params.set('lang', lang);
      }
      const newQuery = params.toString();
      const targetUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.push(targetUrl);
    }
  };

  return (
    <nav
      aria-label="Language selection"
      className={`inline-flex items-center rounded-lg border border-civic-border bg-white p-1 shadow-xs ${className}`}
    >
      <span className="sr-only">Choose language</span>
      {SUPPORTED_LANGUAGES.map((item) => {
        const isSelected = activeLang === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => handleSelect(item.code)}
            aria-pressed={isSelected}
            aria-label={`${item.label} (${item.nativeLabel})`}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-civic-navy text-white shadow-xs font-bold'
                : 'text-civic-navy hover:bg-civic-surface hover:text-civic-navy-dark'
            } ${compact ? 'px-2 py-1 min-h-[36px] min-w-[36px]' : ''}`}
          >
            {item.nativeLabel}
          </button>
        );
      })}
    </nav>
  );
}

export function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense
      fallback={
        <nav
          aria-label="Language selection"
          className={`inline-flex items-center rounded-lg border border-civic-border bg-white p-1 shadow-xs ${props.className ?? ''}`}
        >
          <span className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md bg-civic-navy text-white">
            English
          </span>
        </nav>
      }
    >
      <LanguageSwitcherContent {...props} />
    </Suspense>
  );
}
