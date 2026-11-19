import React, { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { Button } from './Button.js';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  whyItMatters?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  whyItMatters,
  actionLabel,
  onAction,
  actionHref,
  icon,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border border-dashed border-civic-border bg-white p-8 sm:p-12 text-center flex flex-col items-center max-w-xl mx-auto',
        className,
      )}
      {...rest}
    >
      <div className="w-12 h-12 rounded-full bg-civic-surface flex items-center justify-center text-civic-navy mb-4">
        {icon ?? (
          <svg
            className="w-6 h-6 text-civic-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
      </div>

      <h3 className="text-xl font-bold font-heading text-civic-navy mb-2 leading-snug">{title}</h3>

      <p className="text-sm text-civic-charcoal leading-relaxed mb-2">{description}</p>

      {whyItMatters && (
        <p className="text-xs text-civic-muted leading-relaxed max-w-md mb-6">
          <strong>Why this matters:</strong> {whyItMatters}
        </p>
      )}

      {actionLabel && (onAction || actionHref) && (
        <div className="mt-2">
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center font-heading font-medium text-sm px-4 py-2.5 rounded-md bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px]"
            >
              {actionLabel}
            </a>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  height?: string;
  width?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'pill';
  label?: string;
}

export function LoadingSkeleton({
  lines = 1,
  height = 'h-4',
  width = 'w-full',
  rounded = 'md',
  label = 'Loading content...',
  className,
  ...rest
}: LoadingSkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    pill: 'rounded-full',
  }[rounded];

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('space-y-2.5 w-full', className)}
      {...rest}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-civic-surface/80 animate-pulse border border-civic-border/40',
            height,
            index === lines - 1 && lines > 1 ? 'w-4/5' : width,
            roundedClasses,
          )}
        />
      ))}
    </div>
  );
}

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
  className,
  ...rest
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2 text-civic-navy', className)}
      {...rest}
    >
      <svg
        className={cn('animate-spin text-civic-navy', sizeClasses)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-sm font-medium text-civic-muted">{label}</span>
    </div>
  );
}

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this information right now. Please try again or check back shortly.",
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  className,
  ...rest
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-red-200 bg-[#FDF8F8] p-6 sm:p-8 text-center flex flex-col items-center max-w-xl mx-auto',
        className,
      )}
      {...rest}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 text-civic-error flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-lg sm:text-xl font-bold font-heading text-civic-navy mb-2">{title}</h3>

      <p className="text-sm text-civic-charcoal leading-relaxed mb-6">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}
