import { z } from 'zod';

/**
 * Validates that an official URL is an HTTPS URL pointing to a safe public internet destination,
 * strictly defending against SSRF (Server-Side Request Forgery) attacks by blocking:
 * - Non-HTTPS protocols
 * - localhost and local network suffixes (.local, .internal, .localhost)
 * - Cloud instance metadata endpoints (169.254.169.254, metadata.google.internal)
 * - IPv4 private / loopback / link-local / multicast ranges (RFC 1918, RFC 3927, RFC 5735, RFC 5771)
 * - IPv6 loopback, link-local, and unique local addresses
 * - Non-standard sensitive internal service ports (e.g., 5432, 6379, 2375)
 */
export function isSafePublicHttpsUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const url = new URL(urlString.trim());

    // 1. Mandatory HTTPS protocol
    if (url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // 2. Reject empty or local hostnames
    if (
      !hostname ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal'
    ) {
      return false;
    }

    // 3. IPv4 SSRF Filtering
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    if (ipv4Match) {
      const a = Number(ipv4Match[1]);
      const b = Number(ipv4Match[2]);
      const c = Number(ipv4Match[3]);
      const d = Number(ipv4Match[4]);
      if ([a, b, c, d].some((o) => Number.isNaN(o) || o < 0 || o > 255)) return false;

      // 0.0.0.0/8 (Current network)
      if (a === 0) return false;
      // 127.0.0.0/8 (Loopback)
      if (a === 127) return false;
      // 10.0.0.0/8 (RFC 1918 Private)
      if (a === 10) return false;
      // 172.16.0.0/12 (RFC 1918 Private: 172.16.0.0 - 172.31.255.255)
      if (a === 172 && b >= 16 && b <= 31) return false;
      // 192.168.0.0/16 (RFC 1918 Private)
      if (a === 192 && b === 168) return false;
      // 169.254.0.0/16 (RFC 3927 Link-local & Cloud instance metadata)
      if (a === 169 && b === 254) return false;
      // 100.64.0.0/10 (RFC 6598 Shared Address Space / Carrier Grade NAT)
      if (a === 100 && b >= 64 && b <= 127) return false;
      // 198.18.0.0/15 (RFC 2544 Benchmarking)
      if (a === 198 && (b === 18 || b === 19)) return false;
      // 224.0.0.0/4 (RFC 5771 Multicast) & 240.0.0.0/4 (RFC 1112 Reserved)
      if (a >= 224) return false;
    }

    // 4. IPv6 SSRF Filtering
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const inner = hostname.slice(1, -1).toLowerCase();
      // ::1 (Loopback)
      if (inner === '::1' || inner === '0:0:0:0:0:0:0:1') return false;
      // :: (Unspecified)
      if (inner === '::' || inner === '0:0:0:0:0:0:0:0') return false;
      // fe80::/10 (Link-local)
      if (
        inner.startsWith('fe80:') ||
        inner.startsWith('fe8') ||
        inner.startsWith('fe9') ||
        inner.startsWith('fea') ||
        inner.startsWith('feb')
      ) {
        return false;
      }
      // fc00::/7 (Unique local / private: fc00:: - fdff::)
      if (inner.startsWith('fc') || inner.startsWith('fd')) {
        return false;
      }
      // ::ffff:0:0/96 (IPv4-mapped IPv6)
      if (inner.startsWith('::ffff:')) {
        return false;
      }
    }

    // 5. Port restriction: if port is explicitly provided, only allow standard web HTTPS ports (443, 8443)
    if (url.port && url.port !== '443' && url.port !== '8443') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes citizen free-text input by removing null bytes, non-printable control characters,
 * and normalizing unicode representations to prevent filter bypass and injection attacks.
 */
export function sanitizeInputString(input: string, maxLength = 2000): string {
  if (typeof input !== 'string') return '';

  return (
    input
      // Normalize Unicode NFKC to neutralize homoglyph / visual spoofing bypasses
      .normalize('NFKC')
      // Remove null bytes and ASCII control characters (preserving newline, carriage return, and tab)
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, maxLength)
  );
}

/**
 * Zod schema enforcing safe relative internal application paths, completely preventing
 * open-redirect attacks by prohibiting external origins, protocol-relative prefixes (//), and javascript: URIs.
 */
export const safeRelativePathSchema = z
  .string()
  .trim()
  .min(1, 'Relative path cannot be empty')
  .max(500, 'Relative path is too long')
  .regex(/^\/[a-zA-Z0-9_\-/?&=#%.:]*$/, 'Path must be a valid relative path starting with "/"')
  .refine((val) => !val.startsWith('//'), {
    message: 'Protocol-relative paths starting with "//" are prohibited to prevent open redirects',
  })
  .refine((val) => !val.toLowerCase().includes('javascript:'), {
    message: 'javascript: URI schemes are strictly prohibited',
  });
