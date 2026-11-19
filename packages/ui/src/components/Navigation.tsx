import React, { type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
  children?: ReactNode;
}

export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
  ...rest
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50',
        'bg-civic-navy text-white px-4 py-2.5 rounded-md font-heading font-semibold text-sm shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-civic-navy',
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  brandName?: string;
  tagline?: string;
  currentLanguage?: string;
  onLanguageChangeClick?: () => void;
  children?: ReactNode;
}

export function Header({
  brandName = 'JanaSahayak',
  tagline = 'Government services, explained simply.',
  currentLanguage = 'EN',
  onLanguageChangeClick,
  children,
  className,
  ...rest
}: HeaderProps) {
  return (
    <header
      role="banner"
      className={cn('w-full border-b border-civic-border bg-white', className)}
      {...rest}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <a
            href="/"
            className="flex flex-col min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy rounded"
            aria-label={`${brandName} — ${tagline}`}
          >
            <span className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-civic-navy truncate">
              {brandName}
            </span>
            <span className="hidden sm:inline text-xs text-civic-muted font-sans font-medium truncate">
              {tagline}
            </span>
          </a>
        </div>

        <nav aria-label="Primary" className="flex items-center gap-3 shrink-0">
          {children}

          {onLanguageChangeClick ? (
            <button
              type="button"
              onClick={onLanguageChangeClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-civic-border bg-civic-surface text-xs font-semibold text-civic-navy hover:bg-civic-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy cursor-pointer"
              aria-label={`Current language: ${currentLanguage}. Change language`}
            >
              <svg
                className="w-3.5 h-3.5 text-civic-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <span>{currentLanguage.toUpperCase()}</span>
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-civic-border bg-civic-surface text-xs font-semibold text-civic-navy"
              aria-label={`Language: ${currentLanguage}`}
            >
              <span>{currentLanguage.toUpperCase()}</span>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items, className, ...rest }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('py-2', className)} {...rest}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-civic-muted font-medium">
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-civic-border" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast ? 'text-civic-charcoal font-semibold' : 'text-civic-muted')}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="hover:text-civic-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy rounded"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
