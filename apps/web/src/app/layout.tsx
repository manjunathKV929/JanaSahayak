import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#183B50',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'JanaSahayak — Government services, explained simply.',
  description:
    'A multilingual, accessibility-first public-service guidance platform helping citizens understand eligibility, required documents, and official application routes.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JanaSahayak',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-civic-ivory text-civic-charcoal antialiased flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-civic-navy focus:px-4 focus:py-2.5 focus:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-civic-navy shadow-lg font-heading font-semibold text-sm"
        >
          Skip to main content
        </a>
        <ServiceWorkerRegister />
        <NetworkStatusBanner />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
