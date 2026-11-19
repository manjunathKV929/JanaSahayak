const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|authorization|cookie|otp|pin|aadhaar|aadhar|pan|cvv|apikey|api_key)/i;

const AADHAAR_LIKE_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export const LOG_REDACTION_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.otp',
  '*.pin',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.aadhaar',
];

export function redactSensitiveText(input: string): string {
  return input.replace(AADHAAR_LIKE_PATTERN, '[REDACTED_ID]');
}

export function redactSensitiveObject(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSensitiveText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveObject(item));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveObject(entry);
      }
    }
    return result;
  }
  return value;
}
