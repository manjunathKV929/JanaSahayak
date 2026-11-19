import React, { type HTMLAttributes, type ReactNode } from 'react';
import type { VerificationStatus } from '@janasahayak/types';
import { cn } from '../utils/cn.js';
import { Button } from './Button.js';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  elevation?: 'none' | 'subtle';
  interactive?: boolean;
  variant?: 'default' | 'bordered' | 'elevated' | 'civic';
}

export function Card({
  elevation = 'subtle',
  interactive = false,
  variant,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-civic-border rounded-lg p-5 sm:p-6 transition-all',
        (elevation === 'subtle' || variant === 'elevated') && 'shadow-sm',
        interactive &&
          'hover:border-civic-navy/40 hover:shadow-md cursor-pointer focus-within:ring-2 focus-within:ring-civic-navy',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface ServiceCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  summary: string;
  departmentName?: string | undefined;
  stateCode?: string | null | undefined;
  verificationStatus?: VerificationStatus | undefined;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  actionHref?: string | undefined;
}

export function ServiceCard({
  title,
  summary,
  departmentName,
  stateCode,
  verificationStatus = 'VERIFIED',
  actionLabel = 'Check eligibility',
  onAction,
  actionHref,
  className,
  ...rest
}: ServiceCardProps) {
  return (
    <Card className={cn('flex flex-col justify-between gap-4', className)} {...rest}>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {stateCode ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-civic-surface text-civic-charcoal border border-civic-border">
              {stateCode.toUpperCase()}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-civic-surface text-civic-charcoal border border-civic-border">
              CENTRAL
            </span>
          )}

          {departmentName && (
            <span className="text-xs text-civic-muted font-medium truncate max-w-[240px]">
              {departmentName}
            </span>
          )}

          {verificationStatus === 'VERIFIED' && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-civic-green bg-civic-green-light px-2 py-0.5 rounded-full">
              <svg
                className="w-3 h-3 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verified</span>
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold font-heading text-civic-navy tracking-tight leading-snug">
          {title}
        </h3>

        <p className="text-sm text-civic-charcoal/90 leading-relaxed line-clamp-3">{summary}</p>
      </div>

      <div className="pt-2 border-t border-civic-border/60 flex items-center justify-between gap-3">
        {actionHref ? (
          <a
            href={actionHref}
            className="inline-flex items-center justify-center font-heading font-medium text-sm px-4 py-2 rounded-md bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px]"
          >
            {actionLabel}
          </a>
        ) : (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

export interface NextStepCardProps extends HTMLAttributes<HTMLDivElement> {
  stepNumber?: number | undefined;
  title: string;
  description: string;
  actionLabel?: string | undefined;
  actionHref?: string | undefined;
  onAction?: (() => void) | undefined;
  isOfficialRoute?: boolean | undefined;
}

export function NextStepCard({
  stepNumber,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  isOfficialRoute = false,
  className,
  ...rest
}: NextStepCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-civic-navy bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-civic-green">
          {stepNumber ? `Step ${stepNumber} — Your Next Action` : 'Your Next Action'}
        </span>
        {isOfficialRoute && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-civic-navy bg-civic-navy-light px-2.5 py-0.5 rounded-full">
            Official Portal Route
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xl font-bold font-heading text-civic-navy leading-snug">{title}</h4>
        <p className="text-sm text-civic-charcoal leading-relaxed">{description}</p>
      </div>

      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a
              href={actionHref}
              target={isOfficialRoute ? '_blank' : undefined}
              rel={isOfficialRoute ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center font-heading font-semibold text-base px-5 py-2.5 rounded-md bg-civic-green text-white hover:bg-[#2e5746] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-green min-h-[44px]"
            >
              <span>{actionLabel}</span>
              {isOfficialRoute && (
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
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
