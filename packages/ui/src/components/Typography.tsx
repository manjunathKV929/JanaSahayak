import React, { type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'display' | 'h1' | 'h2' | 'h3' | 'h4';
  children: ReactNode;
}

const sizeClasses: Record<NonNullable<HeadingProps['size']>, string> = {
  display: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight',
  h1: 'text-3xl sm:text-4xl font-bold tracking-tight leading-snug',
  h2: 'text-2xl sm:text-3xl font-semibold tracking-tight leading-snug',
  h3: 'text-xl sm:text-2xl font-semibold leading-normal',
  h4: 'text-lg sm:text-xl font-semibold leading-normal',
};

export function Heading({
  as: Component = 'h2',
  size,
  className,
  children,
  ...rest
}: HeadingProps) {
  const resolvedSize = size ?? (Component === 'h5' || Component === 'h6' ? 'h4' : Component);
  const sizeClass = sizeClasses[resolvedSize];

  return (
    <Component className={cn('text-civic-navy font-heading', sizeClass, className)} {...rest}>
      {children}
    </Component>
  );
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: 'large' | 'base' | 'small' | 'caption';
  variant?: 'default' | 'muted' | 'inverse' | 'danger';
  children: ReactNode;
}

const textSizeClasses: Record<NonNullable<TextProps['size']>, string> = {
  large: 'text-lg leading-relaxed',
  base: 'text-base leading-normal',
  small: 'text-sm leading-normal',
  caption: 'text-xs leading-tight font-medium',
};

const textVariantClasses: Record<NonNullable<TextProps['variant']>, string> = {
  default: 'text-civic-charcoal',
  muted: 'text-civic-muted',
  inverse: 'text-white',
  danger: 'text-civic-error',
};

export function Text({
  as: Component = 'p',
  size = 'base',
  variant = 'default',
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <Component
      className={cn(textSizeClasses[size], textVariantClasses[variant], className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

export const Paragraph = Text;
