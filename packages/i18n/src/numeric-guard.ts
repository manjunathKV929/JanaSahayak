import type { NumericPreservationResult } from '@janasahayak/types';

/**
 * Normalizes numerals across Indic scripts (Devanagari ०-९, Kannada ೦-೯) to ASCII digits (0-9).
 */
export function normalizeIndicNumerals(text: string): string {
  return (
    text
      // Devanagari numerals ०-९ (U+0966 to U+096F)
      .replace(/[\u0966-\u096F]/g, (ch) => String(ch.charCodeAt(0) - 0x0966))
      // Kannada numerals ೦-೯ (U+0CE6 to U+0CEF)
      .replace(/[\u0CE6-\u0CEF]/g, (ch) => String(ch.charCodeAt(0) - 0x0ce6))
  );
}

/**
 * Extracts numeric tokens from text, removing commas and standardizing format.
 * Examples matched: "2,50,000", "2.5", "60", "₹500", "50%"
 */
export function extractNumbers(text: string): string[] {
  const normalized = normalizeIndicNumerals(text);
  // Match numbers with optional commas or decimals
  const matches = normalized.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g);
  if (!matches) return [];

  // Normalize by stripping thousand-separating commas so 2,50,000 matches 250000 or 2,50,000
  return matches.map((m) => m.replace(/,/g, ''));
}

/**
 * Validates that all numeric values (thresholds, amounts, ages, dates, percentages)
 * present in the source text are preserved in the translated text.
 * Rule: Never let translation modify numeric rules.
 */
export function validateNumericPreservation(
  sourceText: string,
  translatedText: string,
): NumericPreservationResult {
  const sourceNumbers = extractNumbers(sourceText);
  const targetNumbers = extractNumbers(translatedText);

  // Check that every distinct number in source is found in target
  const targetSet = new Set(targetNumbers);
  const missingNumbers = sourceNumbers.filter((num) => !targetSet.has(num));

  return {
    isValid: missingNumbers.length === 0,
    sourceNumbers,
    targetNumbers,
    missingNumbers,
  };
}

export class NumericPreservationViolationError extends Error {
  public readonly missingNumbers: string[];
  public readonly sourceText: string;
  public readonly translatedText: string;

  constructor(missingNumbers: string[], sourceText: string, translatedText: string) {
    super(
      `Numeric preservation violation: translation altered or omitted numeric thresholds [${missingNumbers.join(
        ', ',
      )}]. Rule: Translation must not modify numeric rules.`,
    );
    this.name = 'NumericPreservationViolationError';
    this.missingNumbers = missingNumbers;
    this.sourceText = sourceText;
    this.translatedText = translatedText;
  }
}

/**
 * Asserts numeric preservation; throws NumericPreservationViolationError if violated.
 */
export function assertNumericPreservation(sourceText: string, translatedText: string): void {
  const result = validateNumericPreservation(sourceText, translatedText);
  if (!result.isValid) {
    throw new NumericPreservationViolationError(result.missingNumbers, sourceText, translatedText);
  }
}
