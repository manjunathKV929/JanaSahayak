import type { AIAssistSourceCitation } from '@janasahayak/types';

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  violations: string[];
}

const PROHIBITED_GUARANTEE_PATTERNS = [
  /guarantee(d)?\s+approval/i,
  /100%\s+guarantee/i,
  /you\s+will\s+definitely\s+(receive|get|be\s+approved)/i,
  /official\s+sanction\s+(is\s+)?granted/i,
  /i\s+(am|represent)\s+the\s+government\s+officer/i,
  /approval\s+is\s+guaranteed/i,
];

const PROHIBITED_CREDENTIAL_REQUESTS = [
  /enter\s+your\s+(otp|pin|password)/i,
  /share\s+your\s+(otp|pin|password)/i,
  /provide\s+your\s+(bank\s+pin|aadhaar\s+otp)/i,
];

const OFFICIAL_DOMAIN_REGEX =
  /^https:\/\/[a-zA-Z0-9-]+\.(?:gov\.in|nic\.in|karnataka\.gov\.in)(?:\/.*)?$/;

export class OutputValidator {
  /**
   * Validates generated LLM output against safety, authority, URL, and anti-hallucination rules.
   */
  public static validate(
    outputText: string,
    approvedSources: AIAssistSourceCitation[] = [],
  ): ValidationResult {
    const violations: string[] = [];
    const sanitizedText = outputText;

    // 1. Check for Prohibited Guarantees
    for (const pattern of PROHIBITED_GUARANTEE_PATTERNS) {
      if (pattern.test(sanitizedText)) {
        violations.push(`Prohibited guarantee pattern: ${pattern.source}`);
      }
    }

    // 2. Check for Credential Requests
    for (const pattern of PROHIBITED_CREDENTIAL_REQUESTS) {
      if (pattern.test(sanitizedText)) {
        violations.push(`Prohibited credential request: ${pattern.source}`);
      }
    }

    // 3. Check Extracted URLs
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const extractedUrls = sanitizedText.match(urlRegex) ?? [];
    const approvedUrls = new Set(approvedSources.map((s) => s.sourceUrl.toLowerCase()));

    for (const url of extractedUrls) {
      const cleanUrl = url.replace(/[.,;:]$/, '').toLowerCase();
      // Must be HTTPS and official gov domain
      if (!cleanUrl.startsWith('https://')) {
        violations.push(`Insecure non-HTTPS URL found in AI response: ${url}`);
      } else if (!OFFICIAL_DOMAIN_REGEX.test(cleanUrl) && !approvedUrls.has(cleanUrl)) {
        violations.push(`Unapproved or non-governmental URL found in AI response: ${url}`);
      }
    }

    const isValid = violations.length === 0;
    return {
      isValid,
      sanitizedText,
      violations,
    };
  }
}
