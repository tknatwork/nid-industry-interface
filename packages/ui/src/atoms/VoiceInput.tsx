'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * VoiceInput — a mic button that dictates speech into a target field via the
 * browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
 *
 * Demo-only, per the plan's Round 2 dashboard section: it is meant to sit
 * beside long descriptive JD-wizard fields (responsibilities, deliverables,
 * supplementary prose). Each finalized transcript chunk is handed back via
 * `onText`, letting the caller append it to whatever field it controls — this
 * primitive holds no field state of its own.
 *
 * Graceful degradation is a hard requirement: where `SpeechRecognition` is
 * unavailable (Firefox, most non-Chromium browsers, SSR), the button renders
 * nothing by default so the surrounding layout is unaffected. Set
 * `hideWhenUnsupported={false}` to instead show a disabled, explained button.
 *
 * Reads only semantic design tokens (`var(--...)`), mirroring the other atoms.
 * Honors `prefers-reduced-motion` by collapsing the listening pulse.
 */

// ---------------------------------------------------------------------------
// Minimal Web Speech API typings.
//
// This project's TS DOM lib ships `SpeechRecognitionResultList` /
// `SpeechRecognitionResult` / `SpeechRecognitionAlternative` but NOT the
// `SpeechRecognition` instance, its constructor, nor the `webkitSpeechRecognition`
// window property. We declare the slice we use here so the component stays
// `any`-free under TS strict.
// ---------------------------------------------------------------------------

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechCapableWindow {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as SpeechCapableWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---------------------------------------------------------------------------

export interface VoiceInputProps {
  /** Called with each finalized transcript chunk. The caller decides how to
   *  apply it (append, replace, etc.) to its target field. */
  readonly onText: (text: string) => void;
  /** BCP-47 language tag for recognition. Defaults to `en-IN`. */
  readonly lang?: string;
  /** Accessible label / tooltip for the button. Defaults to "Dictate". */
  readonly label?: string;
  /** When unsupported: hide entirely (default) or render a disabled button. */
  readonly hideWhenUnsupported?: boolean;
  /** Disable the control regardless of support (e.g. field is read-only). */
  readonly disabled?: boolean;
}

const MIC_SIZE = 18;

export function VoiceInput({
  onText,
  lang = 'en-IN',
  label = 'Dictate',
  hideWhenUnsupported = true,
  disabled = false,
}: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Keep the latest callback without forcing recognition re-creation.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  // Support detection runs only on the client, after mount — so SSR markup
  // matches the initial (unsupported) client render and avoids hydration drift.
  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (Ctor === null) return;

    // Reuse any in-flight instance: if already listening, treat the click as stop.
    if (recognitionRef.current !== null) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results.item(i);
        if (result.isFinal) {
          chunk += result.item(0).transcript;
        }
      }
      const text = chunk.trim();
      if (text.length > 0) {
        onTextRef.current(text);
      }
    };

    recognition.onerror = () => {
      // Permission denied / no-speech / network — fail quietly for the demo.
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [lang]);

  // Stop any active recognition when the component unmounts.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const isDisabled = disabled || !supported;

  if (!supported && hideWhenUnsupported) {
    return null;
  }

  const title = !supported
    ? 'Voice input is not supported in this browser'
    : listening
      ? 'Stop dictation'
      : label;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      disabled={isDisabled}
      aria-label={title}
      aria-pressed={listening}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        width: 'var(--space-8)',
        height: 'var(--space-8)',
        padding: 0,
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--input-border)',
        backgroundColor: listening ? 'var(--accent)' : 'var(--surface-card)',
        color: listening ? 'var(--text-on-accent)' : 'var(--text-secondary)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background-color var(--motion-micro), color var(--motion-micro), border-color var(--motion-micro)',
      }}
    >
      <MicGlyph muted={!listening} />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {listening ? 'Listening' : label}
      </span>
    </button>
  );
}

function MicGlyph({ muted }: { readonly muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={MIC_SIZE}
      height={MIC_SIZE}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Mic capsule */}
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Cradle */}
      <path
        d="M6 11a6 6 0 0 0 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Stand */}
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="8.5" y1="21" x2="15.5" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Muted slash — only when not listening, signals "tap to talk" */}
      {muted && (
        <line
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.45"
        />
      )}
    </svg>
  );
}
