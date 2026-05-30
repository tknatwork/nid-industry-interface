'use client';

import type { CSSProperties, ReactNode } from 'react';

/**
 * ProgressTracker — the sticky, gamified step-completion indicator that rides
 * alongside the JD-posting wizard (plan §N, Round 2). Renders an ordered list
 * of steps as `{ label, done }` and surfaces a deterministic %-complete so a
 * recruiter is nudged toward finishing every section.
 *
 * Pure presentation: completion is computed solely from `steps[].done`, never
 * inferred — the wizard owns the truth and passes it in. Reads only semantic
 * design tokens (no primitives leak in).
 *
 * Layout-agnostic: `orientation="vertical"` (default) is a checklist rail meant
 * to be wrapped in a `position: sticky` container; `orientation="horizontal"`
 * is a compact step bar. The component sets no `position` itself so a parent
 * can make it sticky without fighting the styles here.
 */

export type ProgressTrackerOrientation = 'vertical' | 'horizontal';

export interface ProgressStep {
  /** Visible step name, e.g. "Compensation". */
  readonly label: ReactNode;
  /** Whether this step is fully complete. Drives the % and the check mark. */
  readonly done: boolean;
  /**
   * Optional stable key. Falls back to the index when omitted — fine for the
   * fixed, ordered wizard step list which never reorders.
   */
  readonly id?: string;
}

export interface ProgressTrackerProps {
  /** Ordered steps. The first not-`done` step is marked "current". */
  readonly steps: ReadonlyArray<ProgressStep>;
  /** Layout direction. Defaults to `'vertical'` (the sticky rail). */
  readonly orientation?: ProgressTrackerOrientation;
  /** Optional heading above the steps (e.g. "Your progress"). */
  readonly title?: ReactNode;
  /** Hide the "N% complete" line. Defaults to shown. */
  readonly hidePercent?: boolean;
  /** Accessible label for the progress region. Defaults to "Progress". */
  readonly ariaLabel?: string;
  /** Extra inline style merged onto the root (e.g. `position: 'sticky'`, `top`). */
  readonly style?: CSSProperties;
}

type StepState = 'done' | 'current' | 'upcoming';

function computePercent(steps: ReadonlyArray<ProgressStep>): number {
  if (steps.length === 0) return 0;
  const completed = steps.reduce((count, step) => (step.done ? count + 1 : count), 0);
  return Math.round((completed / steps.length) * 100);
}

/** First not-done step is "current"; everything before the frontier is settled. */
function stateFor(steps: ReadonlyArray<ProgressStep>, index: number): StepState {
  const step = steps[index];
  if (step?.done) return 'done';
  const firstPending = steps.findIndex((s) => !s.done);
  return index === firstPending ? 'current' : 'upcoming';
}

const MARKER_SIZE = 24;
const TRACK_THICKNESS = 2;

const rootBase: CSSProperties = {
  fontFamily: 'var(--ff-sans)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-3)',
  padding: 'var(--space-5)',
  boxShadow: 'var(--shadow-1)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const percentRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-2)',
};

const percentValueStyle: CSSProperties = {
  fontSize: 'var(--fs-24)',
  fontWeight: 'var(--fw-700)',
  color: 'var(--text-strong)',
  lineHeight: 1,
};

const percentLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
};

const meterTrackStyle: CSSProperties = {
  marginTop: 'var(--space-3)',
  height: '6px',
  width: '100%',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  overflow: 'hidden',
};

function meterFillStyle(percent: number): CSSProperties {
  return {
    height: '100%',
    width: `${percent}%`,
    backgroundColor: 'var(--accent)',
    borderRadius: 'var(--radius-full)',
    transition: 'width var(--motion-standard)',
  };
}

function markerStyle(state: StepState): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${MARKER_SIZE}px`,
    height: `${MARKER_SIZE}px`,
    flexShrink: 0,
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--fs-12)',
    fontWeight: 'var(--fw-600)',
    border: '1px solid transparent',
    transition: 'background-color var(--motion-standard), color var(--motion-standard), border-color var(--motion-standard)',
  };
  if (state === 'done') {
    return { ...base, backgroundColor: 'var(--accent)', color: 'var(--accent-text)' };
  }
  if (state === 'current') {
    return {
      ...base,
      backgroundColor: 'var(--surface-card)',
      color: 'var(--accent-strong)',
      borderColor: 'var(--accent)',
    };
  }
  return {
    ...base,
    backgroundColor: 'var(--surface-panel)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-default)',
  };
}

function labelStyle(state: StepState): CSSProperties {
  return {
    fontSize: 'var(--fs-14)',
    lineHeight: 1.3,
    fontWeight: state === 'upcoming' ? 'var(--fw-400)' : 'var(--fw-600)',
    color: state === 'upcoming' ? 'var(--text-secondary)' : 'var(--text-strong)',
  };
}

/** A check glyph for done steps; the 1-based position otherwise. */
function markerContent(state: StepState, position: number): ReactNode {
  if (state === 'done') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden focusable="false">
        <path
          d="M2.5 6.2l2.2 2.3L9.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return position;
}

function VerticalSteps({ steps }: { readonly steps: ReadonlyArray<ProgressStep> }) {
  return (
    <ol
      style={{
        listStyle: 'none',
        margin: 'var(--space-4) 0 0',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {steps.map((step, index) => {
        const state = stateFor(steps, index);
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.id ?? index}
            aria-current={state === 'current' ? 'step' : undefined}
            style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}
          >
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <span style={markerStyle(state)}>{markerContent(state, index + 1)}</span>
              {!isLast && (
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    width: `${TRACK_THICKNESS}px`,
                    minHeight: 'var(--space-4)',
                    marginTop: 'var(--space-1)',
                    marginBottom: 'var(--space-1)',
                    backgroundColor: state === 'done' ? 'var(--accent)' : 'var(--border-default)',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              )}
            </span>
            <span
              style={{
                paddingTop: 'var(--space-1)',
                paddingBottom: isLast ? 0 : 'var(--space-4)',
                ...labelStyle(state),
              }}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function HorizontalSteps({ steps }: { readonly steps: ReadonlyArray<ProgressStep> }) {
  return (
    <ol
      style={{
        listStyle: 'none',
        margin: 'var(--space-4) 0 0',
        padding: 0,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-2)',
      }}
    >
      {steps.map((step, index) => {
        const state = stateFor(steps, index);
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.id ?? index}
            aria-current={state === 'current' ? 'step' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span aria-hidden style={{ flex: 1, height: `${TRACK_THICKNESS}px` }} />
              <span style={markerStyle(state)}>{markerContent(state, index + 1)}</span>
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: `${TRACK_THICKNESS}px`,
                  backgroundColor: isLast ? 'transparent' : state === 'done' ? 'var(--accent)' : 'var(--border-default)',
                  borderRadius: 'var(--radius-full)',
                  visibility: isLast ? 'hidden' : 'visible',
                }}
              />
            </span>
            <span style={{ ...labelStyle(state), maxWidth: '100%' }}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressTracker({
  steps,
  orientation = 'vertical',
  title,
  hidePercent = false,
  ariaLabel = 'Progress',
  style,
}: ProgressTrackerProps) {
  const percent = computePercent(steps);
  const completedCount = steps.reduce((count, step) => (step.done ? count + 1 : count), 0);

  return (
    <section
      role="group"
      aria-label={ariaLabel}
      style={{ ...rootBase, ...style }}
    >
      {title != null && <p style={titleStyle}>{title}</p>}

      {!hidePercent && (
        <>
          <div style={percentRowStyle}>
            <span style={percentValueStyle}>{percent}%</span>
            <span style={percentLabelStyle}>
              {completedCount} of {steps.length} complete
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percent}% complete`}
            style={meterTrackStyle}
          >
            <span style={meterFillStyle(percent)} />
          </div>
        </>
      )}

      {orientation === 'horizontal' ? (
        <HorizontalSteps steps={steps} />
      ) : (
        <VerticalSteps steps={steps} />
      )}
    </section>
  );
}
