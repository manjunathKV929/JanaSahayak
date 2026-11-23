'use client';

import React from 'react';
import Link from 'next/link';
import type { LocationSummary } from '@janasahayak/types';
import { Card } from '@janasahayak/ui';
import { TextToSpeechReader } from './TextToSpeechReader';

interface LocationCardProps {
  location: LocationSummary;
  className?: string;
}

const CENTER_TYPE_LABELS: Record<string, string> = {
  B1_K1_CENTRE: 'Bangalore One / Karnataka One',
  NADAKACHERI: 'Nadakacheri (AJSK)',
  TALUK_OFFICE: 'Taluk Administrative Office',
  DISTRICT_OFFICE: 'District Commissioner Office',
  SEVA_KENDRA: 'Grama One / Seva Kendra',
  OTHER: 'Government Help Center',
};

const ASSISTANCE_LABELS: Record<string, string> = {
  BIOMETRIC_EKYC: 'Biometric e-KYC',
  DOCUMENT_SUBMISSION: 'Document Verification',
  APPLICATION_FILING: 'Assisted Application Filing',
  IN_PERSON_ASSISTANCE: 'In-Person Help Desk',
  GRIEVANCE_DESK: 'Grievance Counter',
};

export function LocationCard({ location, className = '' }: LocationCardProps) {
  const mapQuery =
    location.latitude && location.longitude
      ? `${location.latitude},${location.longitude}`
      : encodeURIComponent(`${location.name}, ${location.address}`);

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const readAloudText = `${location.name}, ${CENTER_TYPE_LABELS[location.centerType] ?? location.centerType}. Located at ${location.address}, District ${location.district}. Operating hours: ${location.operatingHours ?? 'Standard government office hours'}.`;

  return (
    <Card
      variant="bordered"
      className={`p-5 space-y-4 bg-white border-civic-border transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-heading font-bold bg-civic-navy/10 text-civic-navy uppercase tracking-wider">
              {CENTER_TYPE_LABELS[location.centerType] ?? location.centerType}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-civic-ivory text-civic-charcoal border border-civic-border">
              {location.district}
            </span>
            {location.pincode && (
              <span className="text-xs font-mono text-civic-muted">PIN: {location.pincode}</span>
            )}
          </div>
          <h3 className="font-heading font-bold text-base text-civic-navy">{location.name}</h3>
          <p className="text-xs text-civic-charcoal leading-relaxed">{location.address}</p>
        </div>
      </div>

      {/* Operational Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-civic-ivory/60 p-3 rounded border border-civic-border/50">
        <div>
          <span className="text-civic-muted block font-medium">Operating Hours:</span>
          <span className="font-semibold text-civic-navy">
            {location.operatingHours ?? '10:00 AM – 05:30 PM (Working Days)'}
          </span>
        </div>
        <div>
          <span className="text-civic-muted block font-medium">Official Contact:</span>
          <span className="font-semibold text-civic-navy font-mono">
            {location.contactPhone ?? 'District Helpline: 1902'}
          </span>
        </div>
      </div>

      {/* Supported Services */}
      {location.supportedServices.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading">
            Official Services Supported Here:
          </p>
          <div className="flex flex-wrap gap-2">
            {location.supportedServices.map((service) => (
              <Link
                key={service.serviceId}
                href={`/services/${service.serviceSlug}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-civic-ivory border border-civic-border hover:border-civic-navy text-xs text-civic-navy font-medium transition-colors"
              >
                <span>{service.serviceTitle}</span>
                <span className="text-[10px] uppercase font-bold text-civic-green bg-civic-green/10 px-1 py-0.2 rounded">
                  {ASSISTANCE_LABELS[service.assistanceType] ?? service.assistanceType}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-civic-border/60">
        <div className="flex items-center gap-2">
          {location.verifiedSourceUrl && (
            <a
              href={location.verifiedSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold text-civic-navy hover:underline min-h-[44px] px-2"
            >
              Portal Directory ↗
            </a>
          )}
          <TextToSpeechReader text={readAloudText} label="Listen" />
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] shadow-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Get Directions ↗</span>
        </a>
      </div>
    </Card>
  );
}
