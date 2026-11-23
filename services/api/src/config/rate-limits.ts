import { AppError } from '../errors.js';

export interface RouteRateLimitOptions {
  max: number;
  timeWindow?: number | string;
}

/**
 * Tiered Rate Limiting Configurations per threat-model and abuse profiles:
 * - AI endpoints (/search/interpret, /ai/assist): compute-heavy, expensive LLM calls -> 20 req/min
 * - Translation endpoints (/translate, /translate/batch): CPU-heavy translation operations -> 30 req/min
 * - Admin mutations (/admin/* writes): high-privilege state changes, anti-brute-force -> 30 req/min
 * - Sensitive citizen actions (evaluate, step completion): interactive engine evaluation -> 40 req/min
 * - Standard default API tier: 100 req/min
 */
export const RATE_LIMIT_TIERS = {
  AI: {
    max: 20,
    timeWindow: 60000,
  },
  TRANSLATION: {
    max: 30,
    timeWindow: 60000,
  },
  ADMIN_MUTATION: {
    max: 30,
    timeWindow: 60000,
  },
  SENSITIVE_ACTION: {
    max: 40,
    timeWindow: 60000,
  },
} as const;

export function createTieredRateLimitConfig(tier: keyof typeof RATE_LIMIT_TIERS) {
  const selected = RATE_LIMIT_TIERS[tier];
  return {
    rateLimit: {
      max: selected.max,
      timeWindow: selected.timeWindow,
      errorResponseBuilder: (_request: unknown, context: { after: string }) =>
        new AppError(
          429,
          'RATE_LIMITED',
          `Rate limit exceeded for ${tier.toLowerCase()} operations. Retry after ${context.after}.`,
        ),
    },
  };
}
