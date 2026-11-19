/**
 * JanaSahayak Design Tokens
 * Source of truth: DESIGN.md (Civic Editorial visual system)
 */

export const colors = {
  brand: {
    primaryNavy: '#183B50',
    primaryNavyDark: '#102D3D',
    primaryNavyLight: '#EAF1F5',
    civicGreen: '#386B55',
    greenLight: '#EAF3ED',
    warmIvory: '#F7F6F1',
    white: '#FFFFFF',
    charcoal: '#263238',
    muted: '#66727A',
    border: '#DDE3E5',
    surface: '#F3F5F4',
  },
  status: {
    success: '#386B55',
    warning: '#A66A18',
    error: '#B42318',
    info: '#245C7A',
  },
} as const;

export const fonts = {
  heading: 'Manrope, Inter, system-ui, -apple-system, sans-serif',
  body: 'Inter, system-ui, -apple-system, sans-serif',
  hindi: '"Noto Sans Devanagari", Inter, system-ui, sans-serif',
  kannada: '"Noto Sans Kannada", Inter, system-ui, sans-serif',
} as const;

export const typography = {
  display: {
    fontSize: 'clamp(3rem, 5vw, 4rem)',
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.025em',
  },
  h1: {
    fontSize: 'clamp(2.25rem, 4vw, 3rem)',
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
    lineHeight: '1.25',
    fontWeight: '600',
    letterSpacing: '-0.015em',
  },
  h3: {
    fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)',
    lineHeight: '1.3',
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
    lineHeight: '1.35',
    fontWeight: '600',
    letterSpacing: '0',
  },
  bodyLarge: {
    fontSize: '1.125rem', // 18px
    lineHeight: '1.6',
    fontWeight: '400',
  },
  body: {
    fontSize: '1rem', // 16px
    lineHeight: '1.5',
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.5',
    fontWeight: '400',
  },
  caption: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1.4',
    fontWeight: '500',
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const borderRadius = {
  sm: '6px', // small controls
  md: '8px', // controls & form inputs
  lg: '12px', // cards
  xl: '16px', // large surfaces
  pill: '9999px', // badges and tags
} as const;

export const shadows = {
  level0: 'none',
  level1: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  level2: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  level3: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
} as const;

export const breakpoints = {
  mobile: '0px',
  tablet: '640px',
  desktop: '1024px',
  wide: '1280px',
} as const;

export const containers = {
  mobilePadding: '16px',
  tabletPadding: '24px',
  desktopPadding: '32px',
  maxContent: '1280px',
  readingWidth: '720px',
} as const;

export const touchTargets = {
  minTouchSize: '44px',
  recommendedTouchSize: '48px',
} as const;

export type ColorToken = typeof colors;
export type TypographyToken = typeof typography;
export type SpacingToken = typeof spacing;
export type BorderRadiusToken = typeof borderRadius;
