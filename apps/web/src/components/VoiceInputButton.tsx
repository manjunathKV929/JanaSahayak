'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SupportedLanguage } from '@janasahayak/types';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  type VoiceRecognitionController,
  type VoiceState,
} from '@/lib/voice';

interface VoiceInputButtonProps {
  language: SupportedLanguage;
  onSearch: (transcript: string) => void;
  className?: string;
}

export function VoiceInputButton({ language, onSearch, className = '' }: VoiceInputButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const controllerRef = useRef<VoiceRecognitionController | null>(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage('');
    if (!isSpeechRecognitionSupported()) {
      setVoiceState('UNSUPPORTED');
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use text search.',
      );
      return;
    }

    controllerRef.current = createSpeechRecognizer({
      language,
      onResult: (result) => {
        setTranscript(result);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onStateChange: (newState) => {
        setVoiceState(newState);
      },
    });

    controllerRef.current.start();
  };

  const handleStopListening = () => {
    if (controllerRef.current) {
      controllerRef.current.stop();
    }
  };

  const handleConfirmSearch = () => {
    if (transcript.trim()) {
      onSearch(transcript.trim());
      setVoiceState('IDLE');
      setTranscript('');
    }
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setVoiceState('IDLE');
    setTranscript('');
    setErrorMessage('');
  };

  return (
    <div className={`relative inline-flex flex-col ${className}`}>
      {/* Primary Voice Action Button */}
      {voiceState === 'IDLE' && (
        <button
          type="button"
          onClick={handleStartListening}
          aria-label="Speak your problem using voice input"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-civic-border bg-white text-civic-navy font-heading font-semibold text-sm hover:bg-civic-ivory hover:border-civic-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] min-w-[44px] transition-colors shadow-sm"
        >
          <svg
            className="w-5 h-5 text-civic-navy"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          <span className="hidden sm:inline">Speak</span>
        </button>
      )}

      {/* Listening State (Pulsing Mic) */}
      {voiceState === 'LISTENING' && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 p-2 bg-civic-ivory border border-civic-amber/60 rounded-lg shadow-sm"
        >
          <button
            type="button"
            onClick={handleStopListening}
            aria-label="Listening... Tap to finish speaking"
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 animate-pulse"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="text-xs">
            <p className="font-heading font-bold text-civic-navy">Listening...</p>
            <p className="text-civic-muted">Tell us what you need help with.</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel voice input"
            className="text-xs font-semibold text-civic-muted hover:text-civic-navy px-2 py-1 min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Processing State */}
      {voiceState === 'PROCESSING' && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 p-2.5 bg-civic-ivory border border-civic-border rounded-lg text-xs font-semibold text-civic-navy"
        >
          <span className="w-3 h-3 border-2 border-civic-navy border-t-transparent rounded-full animate-spin"></span>
          <span>Transcribing speech...</span>
        </div>
      )}

      {/* Confirmation State (Design System Sec 52 Confirmation) */}
      {voiceState === 'CONFIRMING' && (
        <div
          role="region"
          aria-labelledby="voice-confirm-heading"
          className="absolute z-30 top-full mt-2 left-0 right-0 sm:right-auto sm:w-96 p-4 bg-white border border-civic-navy/30 rounded-lg shadow-lg space-y-3"
        >
          <div className="space-y-1">
            <p
              id="voice-confirm-heading"
              className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading"
            >
              You said:
            </p>
            <p className="text-sm font-medium text-civic-navy bg-civic-ivory p-2.5 rounded border border-civic-border/70 break-words">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmSearch}
              aria-label={`Search for ${transcript}`}
              className="flex-1 inline-flex items-center justify-center font-heading font-semibold text-xs px-3 py-2 rounded bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px]"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                onSearch(transcript);
                setVoiceState('IDLE');
              }}
              className="inline-flex items-center justify-center font-heading font-semibold text-xs px-3 py-2 rounded border border-civic-border text-civic-charcoal hover:bg-civic-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center font-heading font-semibold text-xs px-2.5 py-2 text-civic-muted hover:text-civic-navy min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error or Unsupported State */}
      {(voiceState === 'ERROR' || voiceState === 'UNSUPPORTED') && (
        <div
          role="alert"
          aria-live="polite"
          className="absolute z-30 top-full mt-2 left-0 right-0 sm:right-auto sm:w-80 p-3 bg-red-50 border border-red-200 rounded-lg shadow-md space-y-2 text-xs"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-red-800 font-medium">{errorMessage}</p>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Dismiss error message"
              className="text-red-600 hover:text-red-900 font-bold p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
