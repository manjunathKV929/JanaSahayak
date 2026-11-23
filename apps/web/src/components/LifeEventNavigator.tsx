'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { LifeEventRecord, SupportedLanguage } from '@janasahayak/types';
import { Card } from '@janasahayak/ui';
import { TextToSpeechReader } from './TextToSpeechReader';

interface LifeEventNavigatorProps {
  events: LifeEventRecord[];
  activeLanguage?: SupportedLanguage;
}

export function LifeEventNavigator({ events, activeLanguage = 'en' }: LifeEventNavigatorProps) {
  const [selectedKey, setSelectedKey] = useState<string>(events[0]?.key ?? '');

  const activeEvent = events.find((e) => e.key === selectedKey) ?? events[0];

  return (
    <div className="space-y-8">
      {/* Life-Event Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {events.map((event) => {
          const isSelected = event.key === selectedKey;
          const displayTitle = event.title[activeLanguage] ?? event.title['en'];

          return (
            <button
              key={event.key}
              type="button"
              onClick={() => setSelectedKey(event.key)}
              aria-pressed={isSelected}
              className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition-all min-h-[44px] ${
                isSelected
                  ? 'bg-civic-navy text-white border-civic-navy shadow-md'
                  : 'bg-white text-civic-charcoal border-civic-border hover:bg-civic-ivory hover:border-civic-navy'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80 font-heading">
                  Milestone {event.order}
                </span>
                <span className="font-heading font-bold text-xs mt-1 block">{displayTitle}</span>
              </div>
              <span
                className={`text-[10px] mt-2 block font-medium ${isSelected ? 'text-white/80' : 'text-civic-muted'}`}
              >
                {event.serviceBundles.length} bundled schemes →
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Life-Event Deep-Dive Bundle */}
      {activeEvent && (
        <div className="bg-white rounded-lg border border-civic-border p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-civic-border pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                Life Transition Guidance
              </span>
              <h2 className="font-heading font-bold text-xl text-civic-navy">
                {activeEvent.title[activeLanguage] ?? activeEvent.title['en']}
              </h2>
              {activeLanguage !== 'en' && (
                <p className="text-xs font-heading text-civic-muted">{activeEvent.title['en']}</p>
              )}
              <p className="text-sm text-civic-charcoal pt-1 max-w-3xl leading-relaxed">
                {activeEvent.description[activeLanguage] ?? activeEvent.description['en']}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TextToSpeechReader
                text={`${activeEvent.title[activeLanguage] ?? activeEvent.title['en']}. ${
                  activeEvent.description[activeLanguage] ?? activeEvent.description['en']
                }`}
                language={activeLanguage}
                label="Listen"
              />
              <Link
                href={`/life-events/${activeEvent.key}`}
                className="inline-flex items-center px-3 py-1.5 rounded text-xs font-semibold bg-civic-navy text-white hover:bg-civic-navy-dark min-h-[44px]"
              >
                Full Checklist Page →
              </Link>
            </div>
          </div>

          {/* Bundled Services Timeline */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-sm text-civic-navy uppercase tracking-wider">
              Recommended Service Actions & Documents
            </h3>

            <div className="space-y-4">
              {activeEvent.serviceBundles.map((bundle, index) => (
                <Card
                  key={bundle.serviceId}
                  variant="bordered"
                  className="p-5 bg-civic-ivory/40 border-civic-border space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-civic-navy bg-white px-2 py-0.5 rounded border border-civic-border">
                          Step {index + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            bundle.importance === 'CRITICAL'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {bundle.importance} Action
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-base text-civic-navy pt-1">
                        {bundle.title}
                      </h4>
                    </div>

                    <Link
                      href={`/services/${bundle.slug}`}
                      className="inline-flex items-center text-xs font-bold text-civic-navy hover:underline min-h-[44px]"
                    >
                      View Service Guide →
                    </Link>
                  </div>

                  {/* Typical Timeline Advice */}
                  <div className="text-xs bg-white p-2.5 rounded border border-civic-border/70 flex items-center gap-2">
                    <span className="font-bold text-civic-green font-heading uppercase text-[10px]">
                      Recommended Timeline:
                    </span>
                    <span className="text-civic-charcoal font-medium">
                      {bundle.typicalTimeline}
                    </span>
                  </div>

                  {/* Required Documents */}
                  {bundle.requiredDocuments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-civic-muted font-heading">
                        Essential Documents to Prepare:
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-civic-charcoal">
                        {bundle.requiredDocuments.map((doc, dIdx) => (
                          <li key={dIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-civic-navy"></span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
