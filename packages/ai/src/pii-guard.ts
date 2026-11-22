import type { PIIGuardResult } from '@janasahayak/types';

// Patterns for Indian PII identifiers
const AADHAAR_REGEX = /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const BANK_ACCOUNT_REGEX = /\b(account|acct|a\/c|bank)\s*(?:no\.?|number)?[: -]*([0-9]{9,18})\b/gi;
const OTP_PIN_REGEX = /\b(otp|one time password|pin|cvv|password)[: -]*([0-9a-zA-Z]{4,8})\b/gi;

// Prompt injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(in\s+)?(developer|dan|jailbreak|unrestricted)\s+mode/i,
  /system\s*prompt\s*:\s*/i,
  /override\s+(system|safety|security)\s+(policy|rules|instructions)/i,
  /reveal\s+(all\s+)?(internal|hidden|secret|system)\s+(instructions|prompt|keys)/i,
  /act\s+as\s+a\s+government\s+official\s+and\s+approve/i,
];

/**
 * PII and Prompt-Injection Guard.
 * Analyzes input text, redacts sensitive identifiers, and neutralizes prompt-injection attempts.
 */
export class PIIGuard {
  /**
   * Scans and sanitizes user input before passing to LLM or RAG pipeline.
   */
  public static sanitize(text: string): PIIGuardResult {
    let sanitized = text;
    const redactions: string[] = [];
    let hasPII = false;
    let isSuspicious = false;
    let reason: string | undefined;

    // 1. Check Prompt Injection
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        isSuspicious = true;
        reason = 'Prompt injection pattern detected';
        sanitized = sanitized.replace(pattern, '[SUSPICIOUS_PROMPT_BLOCKED]');
      }
    }

    // 2. Redact Aadhaar Numbers
    if (AADHAAR_REGEX.test(sanitized)) {
      hasPII = true;
      redactions.push('AADHAAR_NUMBER');
      sanitized = sanitized.replace(AADHAAR_REGEX, '[REDACTED_AADHAAR]');
    }

    // 3. Redact PAN Numbers
    if (PAN_REGEX.test(sanitized)) {
      hasPII = true;
      redactions.push('PAN_NUMBER');
      sanitized = sanitized.replace(PAN_REGEX, '[REDACTED_PAN]');
    }

    // 4. Redact Passwords / OTP / PIN
    if (OTP_PIN_REGEX.test(sanitized)) {
      hasPII = true;
      redactions.push('AUTH_CREDENTIAL');
      sanitized = sanitized.replace(OTP_PIN_REGEX, '$1: [REDACTED_SECRET]');
    }

    // 5. Redact Bank Account Numbers
    if (BANK_ACCOUNT_REGEX.test(sanitized)) {
      hasPII = true;
      redactions.push('BANK_ACCOUNT');
      sanitized = sanitized.replace(BANK_ACCOUNT_REGEX, '$1: [REDACTED_ACCOUNT]');
    }

    return {
      sanitizedText: sanitized,
      hasPII,
      redactions,
      isSuspicious,
      ...(reason ? { reason } : {}),
    };
  }
}
