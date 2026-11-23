'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SupportedLanguage } from '@janasahayak/types';
import { isSpeechSynthesisSupported, speakText } from '@/lib/voice';

interface TextToSpeechReaderProps {
  text: string;
  language?: SupportedLanguage;
  label?: string;
  className?: string;
}

export function TextToSpeechReader({
  text,
  language = 'en',
  label = 'Read aloud',
  className = '',
}: TextToSpeechReaderProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());
    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isPlaying) {
      if (cancelRef.current) {
        cancelRef.current();
      }
      setIsPlaying(false);
    } else {
      const controller = speakText(text, language, {
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
      cancelRef.current = controller.cancel;
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Stop reading aloud' : `${label} (${language.toUpperCase()})`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-civic-border bg-white text-xs font-semibold text-civic-navy hover:bg-civic-ivory hover:border-civic-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] min-w-[44px] shadow-sm transition-colors ${className}`}
    >
      {isPlaying ? (
        <>
          <span
            className="w-2.5 h-2.5 bg-red-600 rounded-sm animate-pulse"
            aria-hidden="true"
          ></span>
          <span>Stop Audio</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 text-civic-navy"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
