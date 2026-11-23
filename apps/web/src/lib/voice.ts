import type { SupportedLanguage } from '@janasahayak/types';

export type VoiceState =
  'IDLE' | 'LISTENING' | 'PROCESSING' | 'CONFIRMING' | 'ERROR' | 'UNSUPPORTED';

export interface VoiceRecognitionOptions {
  language: SupportedLanguage;
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onStateChange: (state: VoiceState) => void;
}

export interface VoiceRecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function getVoiceLocale(lang: SupportedLanguage): string {
  switch (lang) {
    case 'kn':
      return 'kn-IN';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

// Browser Web Speech Recognition interface polyfill
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

type SpeechRecognitionConstructor = new () => IWindowSpeechRecognition;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function createSpeechRecognizer(
  options: VoiceRecognitionOptions,
): VoiceRecognitionController {
  if (!isSpeechRecognitionSupported()) {
    options.onStateChange('UNSUPPORTED');
    options.onError('Speech recognition is not supported in this browser.');
    return {
      start: () => options.onStateChange('UNSUPPORTED'),
      stop: () => {},
      abort: () => {},
    };
  }

  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!SpeechRec) {
    options.onStateChange('UNSUPPORTED');
    return { start: () => {}, stop: () => {}, abort: () => {} };
  }

  const recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = getVoiceLocale(options.language);

  recognition.onstart = () => {
    options.onStateChange('LISTENING');
  };

  recognition.onresult = (event: ISpeechRecognitionEvent) => {
    options.onStateChange('PROCESSING');
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (result && result[0]) {
        finalTranscript += result[0].transcript;
      }
    }
    const clean = finalTranscript.trim();
    if (clean) {
      options.onResult(clean);
      options.onStateChange('CONFIRMING');
    } else {
      options.onStateChange('IDLE');
    }
  };

  recognition.onerror = (event: { error: string }) => {
    options.onStateChange('ERROR');
    const msg =
      event.error === 'not-allowed'
        ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
        : `Voice recognition error: ${event.error}`;
    options.onError(msg);
  };

  recognition.onend = () => {
    // Will remain in CONFIRMING if result came through; else reverts to IDLE
  };

  return {
    start: () => {
      try {
        recognition.lang = getVoiceLocale(options.language);
        recognition.start();
      } catch {
        options.onStateChange('ERROR');
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Safe noop
      }
    },
    abort: () => {
      try {
        recognition.abort();
        options.onStateChange('IDLE');
      } catch {
        // Safe noop
      }
    },
  };
}

export function speakText(
  text: string,
  language: SupportedLanguage,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  },
): { cancel: () => void } {
  if (!isSpeechSynthesisSupported()) {
    callbacks?.onError?.('Text-to-speech is not supported in this browser.');
    return { cancel: () => {} };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getVoiceLocale(language);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
  if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
  if (callbacks?.onError) {
    utterance.onerror = (e) => callbacks.onError?.(e.error);
  }

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      window.speechSynthesis.cancel();
      callbacks?.onEnd?.();
    },
  };
}
