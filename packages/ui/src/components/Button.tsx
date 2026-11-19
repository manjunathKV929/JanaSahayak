import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-civic-navy text-white hover:bg-civic-navy-dark active:bg-black border border-transparent shadow-sm',
  secondary:
    'bg-white text-civic-navy border border-civic-border hover:bg-civic-surface active:bg-civic-navy-light shadow-sm',
  tertiary:
    'bg-transparent text-civic-navy hover:bg-civic-surface hover:underline border border-transparent',
  danger:
    'bg-civic-error text-white hover:bg-red-800 active:bg-red-900 border border-transparent shadow-sm',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-sm px-3.5 py-1.5 min-h-[36px] min-w-[36px] rounded-md gap-1.5',
  md: 'text-base px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-md gap-2 font-medium',
  lg: 'text-lg px-6 py-3 min-h-[48px] min-w-[48px] rounded-lg gap-2.5 font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-heading transition-colors cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
