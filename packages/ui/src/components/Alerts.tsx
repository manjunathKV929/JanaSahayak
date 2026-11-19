import React, { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'critical' | 'success';
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}

const variantStyles: Record<
  NonNullable<AlertProps['variant']>,
  {
    container: string;
    titleColor: string;
    icon: (className: string) => ReactNode;
    role?: 'alert' | 'status';
  }
> = {
  info: {
    container: 'bg-civic-navy-light/40 border-[#b8ceda] text-civic-charcoal',
    titleColor: 'text-civic-navy',
    role: 'status',
    icon: (cls) => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  warning: {
    container: 'bg-[#FEF7EC] border-[#F2DEBA] text-[#5C3B0D]',
    titleColor: 'text-[#8A530E]',
    role: 'status',
    icon: (cls) => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  critical: {
    container: 'bg-[#FDF2F2] border-[#F8C8C8] text-[#7A1913]',
    titleColor: 'text-civic-error',
    role: 'alert',
    icon: (cls) => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  success: {
    container: 'bg-civic-green-light/60 border-[#BCD8C9] text-[#224434]',
    titleColor: 'text-civic-green',
    role: 'status',
    icon: (cls) => (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  action,
  className,
  ...rest
}: AlertProps) {
  const current = variantStyles[variant];

  return (
    <div
      role={current.role}
      className={cn(
        'rounded-md border p-4 sm:p-4.5 flex gap-3 sm:gap-3.5',
        current.container,
        className,
      )}
      {...rest}
    >
      <div className="shrink-0 mt-0.5">{current.icon('w-5 h-5')}</div>
      <div className="space-y-1 min-w-0 flex-1">
        {title && (
          <h5 className={cn('text-sm font-semibold font-heading leading-snug', current.titleColor)}>
            {title}
          </h5>
        )}
        <div className="text-sm leading-relaxed">{children}</div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

export interface VerificationBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'VERIFIED' | 'REVIEW_DUE' | 'DEPRECATED' | 'DISPUTED' | 'UNVERIFIED';
  lastVerifiedAt?: string | undefined;
  sourcePublisher?: string | undefined;
}

export function VerificationBadge({
  status,
  lastVerifiedAt,
  sourcePublisher,
  className,
  ...rest
}: VerificationBadgeProps) {
  if (status === 'VERIFIED') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-civic-green-light text-civic-green border border-civic-green/20',
          className,
        )}
        title={
          lastVerifiedAt
            ? `Verified from official source on ${lastVerifiedAt}${sourcePublisher ? ` (${sourcePublisher})` : ''}`
            : 'Verified from official government source'
        }
        {...rest}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Verified</span>
        {lastVerifiedAt && <span className="font-normal opacity-80">· {lastVerifiedAt}</span>}
      </span>
    );
  }

  if (status === 'REVIEW_DUE') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF7EC] text-[#8A530E] border border-[#F2DEBA]',
          className,
        )}
        title="Verification review is scheduled"
        {...rest}
      >
        <span>Review due</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-civic-surface text-civic-muted border border-civic-border',
        className,
      )}
      {...rest}
    >
      <span>Unverified draft</span>
    </span>
  );
}

export interface TrustNoticeProps extends HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

export function TrustNotice({ compact = false, className, ...rest }: TrustNoticeProps) {
  return (
    <aside
      aria-label="Guidance and security notice"
      className={cn(
        'rounded-md border border-civic-border bg-white text-civic-charcoal p-4 sm:p-5',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-civic-navy shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <div className="space-y-1 text-sm leading-relaxed">
          <p className="font-semibold text-civic-navy font-heading">
            Guidance layer, not a government authority
          </p>
          <p className="text-civic-charcoal/90">
            JanaSahayak explains public services and directs you to official portals. We do not
            issue certificates or decide eligibility.
          </p>
          {!compact && (
            <p className="text-xs text-civic-muted pt-1">
              <strong>Security tip:</strong> Never enter OTPs, bank passwords, Aadhaar cards, or
              payment PINs to view service information.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
