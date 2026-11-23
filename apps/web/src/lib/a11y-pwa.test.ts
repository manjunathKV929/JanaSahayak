import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { colors } from '@janasahayak/ui';

describe('@janasahayak/web Accessibility + PWA (Phase 12)', () => {
  const rootDir = process.cwd();
  const webDir = path.join(rootDir, 'apps', 'web');
  const publicDir = path.join(webDir, 'public');

  describe('PWA Web App Manifest', () => {
    const manifestPath = path.join(publicDir, 'manifest.webmanifest');

    it('manifest.webmanifest exists and is valid JSON', () => {
      assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest must exist in apps/web/public');
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      assert.ok(manifest);
    });

    it('contains all required PWA manifest fields per specifications', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      assert.equal(manifest.name, 'JanaSahayak — Government Services Explained');
      assert.equal(manifest.short_name, 'JanaSahayak');
      assert.equal(manifest.start_url, '/');
      assert.equal(manifest.display, 'standalone');
      assert.equal(manifest.background_color, '#F7F6F1');
      assert.equal(manifest.theme_color, '#183B50');
      assert.equal(manifest.lang, 'en');
      assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);
    });

    it('references valid icon files that physically exist on disk', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      for (const icon of manifest.icons) {
        const iconPath = path.join(publicDir, icon.src.replace(/^\//, ''));
        assert.ok(
          fs.existsSync(iconPath),
          `Referenced icon ${icon.src} does not exist at ${iconPath}`,
        );
      }
    });

    it('includes a maskable icon for adaptive Android icon shapes', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const hasMaskable = manifest.icons.some(
        (icon: { purpose?: string }) => icon.purpose === 'maskable',
      );
      assert.ok(hasMaskable, 'PWA manifest must include at least one maskable icon');
    });
  });

  describe('Service Worker & Offline Caching Strategy', () => {
    const swPath = path.join(publicDir, 'sw.js');

    it('sw.js exists and implements service worker lifecycle hooks', () => {
      assert.ok(fs.existsSync(swPath), 'sw.js must exist in apps/web/public');
      const swCode = fs.readFileSync(swPath, 'utf-8');
      assert.match(swCode, /addEventListener\('install'/);
      assert.match(swCode, /addEventListener\('activate'/);
      assert.match(swCode, /addEventListener\('fetch'/);
    });

    it('precaches core navigation targets and offline fallback', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');
      assert.match(swCode, /'\/offline'/);
      assert.match(swCode, /'\/manifest\.webmanifest'/);
      assert.match(swCode, /'\/favicon\.svg'/);
    });

    it('implements network-first navigation with offline fallback', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');
      assert.match(swCode, /request\.mode === 'navigate'/);
      assert.match(swCode, /caches\.match\('\/offline'\)/);
    });

    it('implements cache-first strategy for static immutable assets', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');
      assert.match(swCode, /\/_next\/static\//);
      assert.match(swCode, /\/icons\//);
    });

    it('offline page route /offline exists and implements accessible guidance', () => {
      const offlinePagePath = path.join(webDir, 'src', 'app', 'offline', 'page.tsx');
      assert.ok(
        fs.existsSync(offlinePagePath),
        'Offline page must exist at src/app/offline/page.tsx',
      );
      const content = fs.readFileSync(offlinePagePath, 'utf-8');
      assert.match(content, /You are currently offline/);
      assert.match(content, /Retry Connection/);
    });
  });

  describe('WCAG 2.2 AA Color Contrast Ratios', () => {
    /**
     * Helper to compute relative luminance per WCAG 2.2 specifications:
     * https://www.w3.org/WAI/GL/wiki/Relative_luminance
     */
    function getLuminance(hex: string): number {
      const rgb = hex.replace('#', '');
      const r = parseInt(rgb.substring(0, 2), 16) / 255;
      const g = parseInt(rgb.substring(2, 4), 16) / 255;
      const b = parseInt(rgb.substring(4, 6), 16) / 255;

      const [rl, gl, bl] = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
      );

      return 0.2126 * (rl ?? 0) + 0.7152 * (gl ?? 0) + 0.0722 * (bl ?? 0);
    }

    function getContrastRatio(hex1: string, hex2: string): number {
      const lum1 = getLuminance(hex1);
      const lum2 = getLuminance(hex2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    it('primaryNavy on white passes WCAG AAA for normal text (ratio >= 7.0)', () => {
      const ratio = getContrastRatio(colors.brand.primaryNavy, colors.brand.white);
      assert.ok(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
    });

    it('primaryNavy on warmIvory passes WCAG AAA for normal text (ratio >= 7.0)', () => {
      const ratio = getContrastRatio(colors.brand.primaryNavy, colors.brand.warmIvory);
      assert.ok(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
    });

    it('charcoal body text on white passes WCAG AAA for normal text (ratio >= 7.0)', () => {
      const ratio = getContrastRatio(colors.brand.charcoal, colors.brand.white);
      assert.ok(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
    });

    it('charcoal body text on warmIvory passes WCAG AAA for normal text (ratio >= 7.0)', () => {
      const ratio = getContrastRatio(colors.brand.charcoal, colors.brand.warmIvory);
      assert.ok(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
    });

    it('civicGreen text on white passes WCAG AA for normal text (ratio >= 4.5)', () => {
      const ratio = getContrastRatio(colors.brand.civicGreen, colors.brand.white);
      assert.ok(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
    });

    it('error status text on white passes WCAG AA for normal text (ratio >= 4.5)', () => {
      const ratio = getContrastRatio(colors.status.error, colors.brand.white);
      assert.ok(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
    });
  });

  describe('Keyboard, Reduced Motion & Semantic Landmarks', () => {
    it('globals.css enforces prefers-reduced-motion: reduce', () => {
      const cssPath = path.join(webDir, 'src', 'app', 'globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      assert.match(cssContent, /prefers-reduced-motion:\s*reduce/);
      assert.match(cssContent, /animation-duration:\s*0\.01ms/);
    });

    it('layout.tsx provides skip link jumping directly to main-content', () => {
      const layoutPath = path.join(webDir, 'src', 'app', 'layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      assert.match(layoutContent, /href="#main-content"/);
      assert.match(layoutContent, /Skip to main content/);
      assert.match(layoutContent, /NetworkStatusBanner/);
      assert.match(layoutContent, /ServiceWorkerRegister/);
    });

    it('interactive components implement minimum 44px touch targets on mobile', () => {
      const buttonPath = path.join(rootDir, 'packages', 'ui', 'src', 'components', 'Button.tsx');
      const buttonContent = fs.readFileSync(buttonPath, 'utf-8');
      assert.match(buttonContent, /min-h-\[44px\]/);
      assert.match(buttonContent, /min-w-\[44px\]/);
    });
  });
});
