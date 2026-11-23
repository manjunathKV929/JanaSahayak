import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isSafePublicHttpsUrl,
  officialHttpsUrlSchema,
  safeRelativePathSchema,
  sanitizeInputString,
} from './index.js';

describe('Security Validation & SSRF Hardening', () => {
  describe('isSafePublicHttpsUrl', () => {
    it('allows valid public HTTPS government and service URLs', () => {
      assert.equal(isSafePublicHttpsUrl('https://ssp.postmatric.karnataka.gov.in'), true);
      assert.equal(isSafePublicHttpsUrl('https://nadakacheri.karnataka.gov.in'), true);
      assert.equal(isSafePublicHttpsUrl('https://karnataka.gov.in'), true);
      assert.equal(isSafePublicHttpsUrl('https://india.gov.in/my-scheme'), true);
      assert.equal(isSafePublicHttpsUrl('https://service.gov.in:443/apply'), true);
      assert.equal(isSafePublicHttpsUrl('https://service.gov.in:8443/apply'), true);
    });

    it('rejects non-HTTPS protocols', () => {
      assert.equal(isSafePublicHttpsUrl('http://ssp.postmatric.karnataka.gov.in'), false);
      assert.equal(isSafePublicHttpsUrl('ftp://gov.in/files'), false);
      assert.equal(isSafePublicHttpsUrl('file:///etc/passwd'), false);
      assert.equal(isSafePublicHttpsUrl('javascript:alert(1)'), false);
    });

    it('rejects localhost, local suffixes, and cloud metadata hostnames', () => {
      assert.equal(isSafePublicHttpsUrl('https://localhost'), false);
      assert.equal(isSafePublicHttpsUrl('https://localhost:443/admin'), false);
      assert.equal(isSafePublicHttpsUrl('https://internal.localhost/'), false);
      assert.equal(isSafePublicHttpsUrl('https://service.local/'), false);
      assert.equal(isSafePublicHttpsUrl('https://backend.internal/'), false);
      assert.equal(
        isSafePublicHttpsUrl('https://metadata.google.internal/computeMetadata/v1/'),
        false,
      );
    });

    it('rejects IPv4 loopback, private ranges, link-local metadata, and multicast', () => {
      assert.equal(isSafePublicHttpsUrl('https://127.0.0.1/admin'), false);
      assert.equal(isSafePublicHttpsUrl('https://127.0.0.2:443/'), false);
      assert.equal(isSafePublicHttpsUrl('https://10.0.0.1/secrets'), false);
      assert.equal(isSafePublicHttpsUrl('https://10.255.255.255/'), false);
      assert.equal(isSafePublicHttpsUrl('https://172.16.0.1/'), false);
      assert.equal(isSafePublicHttpsUrl('https://172.31.255.255/'), false);
      assert.equal(isSafePublicHttpsUrl('https://192.168.0.1/'), false);
      assert.equal(isSafePublicHttpsUrl('https://192.168.1.100/'), false);
      assert.equal(isSafePublicHttpsUrl('https://169.254.169.254/latest/meta-data/'), false);
      assert.equal(isSafePublicHttpsUrl('https://0.0.0.0/'), false);
      assert.equal(isSafePublicHttpsUrl('https://224.0.0.1/'), false);
    });

    it('rejects IPv6 loopback, link-local, and unique local addresses', () => {
      assert.equal(isSafePublicHttpsUrl('https://[::1]/'), false);
      assert.equal(isSafePublicHttpsUrl('https://[::]/'), false);
      assert.equal(isSafePublicHttpsUrl('https://[fe80::1]/'), false);
      assert.equal(isSafePublicHttpsUrl('https://[fc00::1]/'), false);
      assert.equal(isSafePublicHttpsUrl('https://[fd12:3456:789a::1]/'), false);
      assert.equal(isSafePublicHttpsUrl('https://[::ffff:127.0.0.1]/'), false);
    });

    it('rejects sensitive non-standard internal ports', () => {
      assert.equal(isSafePublicHttpsUrl('https://karnataka.gov.in:5432/'), false);
      assert.equal(isSafePublicHttpsUrl('https://karnataka.gov.in:6379/'), false);
      assert.equal(isSafePublicHttpsUrl('https://karnataka.gov.in:22/'), false);
      assert.equal(isSafePublicHttpsUrl('https://karnataka.gov.in:8080/'), false);
    });

    it('integrates with officialHttpsUrlSchema in Zod', () => {
      const valid = officialHttpsUrlSchema.safeParse('https://ssp.postmatric.karnataka.gov.in');
      assert.equal(valid.success, true);

      const invalidLoopback = officialHttpsUrlSchema.safeParse('https://127.0.0.1/admin');
      assert.equal(invalidLoopback.success, false);

      const invalidMetadata = officialHttpsUrlSchema.safeParse(
        'https://169.254.169.254/latest/meta-data/',
      );
      assert.equal(invalidMetadata.success, false);
    });
  });

  describe('safeRelativePathSchema', () => {
    it('allows valid relative internal paths', () => {
      assert.equal(
        safeRelativePathSchema.safeParse('/services/synthetic-post-matric-scholarship').success,
        true,
      );
      assert.equal(safeRelativePathSchema.safeParse('/documents/doc-income?lang=kn').success, true);
      assert.equal(safeRelativePathSchema.safeParse('/').success, true);
    });

    it('rejects protocol-relative prefixes to prevent open redirects', () => {
      const res = safeRelativePathSchema.safeParse('//evil.com/phishing');
      assert.equal(res.success, false);
    });

    it('rejects absolute URLs with external domains', () => {
      assert.equal(safeRelativePathSchema.safeParse('https://evil.com/phishing').success, false);
      assert.equal(safeRelativePathSchema.safeParse('http://evil.com/phishing').success, false);
    });

    it('rejects javascript: schemes and non-leading slash strings', () => {
      assert.equal(safeRelativePathSchema.safeParse('javascript:alert(1)').success, false);
      assert.equal(safeRelativePathSchema.safeParse('services/without-slash').success, false);
      assert.equal(safeRelativePathSchema.safeParse('').success, false);
    });
  });

  describe('sanitizeInputString', () => {
    it('removes null bytes and control characters while preserving valid text', () => {
      const raw = 'Hello\u0000World\u0007!\nHow are you?';
      const cleaned = sanitizeInputString(raw);
      assert.equal(cleaned, 'HelloWorld!\nHow are you?');
    });

    it('normalizes unicode NFKC representations', () => {
      // Full-width latin characters normalized to standard ASCII
      const fullwidth = 'Ｈｅｌｌｏ';
      const normalized = sanitizeInputString(fullwidth);
      assert.equal(normalized, 'Hello');
    });

    it('enforces maximum length boundary', () => {
      const longText = 'A'.repeat(50);
      assert.equal(sanitizeInputString(longText, 20).length, 20);
    });
  });
});
