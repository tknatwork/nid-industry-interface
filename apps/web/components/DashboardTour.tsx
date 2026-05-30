'use client';

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Overlay, ProgressTracker, Button, StatusPill, type StatusTone } from '@nid/ui';

/**
 * DashboardTour — the first-visit recruiter walkthrough (plan §4.19).
 *
 * A seven-step guided tour rendered inside an `Overlay`, with a `ProgressTracker`
 * step rail down the side so a recruiter can see how far they are (visited steps
 * read as `done`). Each step is a concise, sandboxed explainer of one dashboard
 * surface — what it is and the one rule that governs it — so a brand-new
 * recruiter knows the lay of the land before they touch anything.
 *
 * It self-gates on first visit: on mount it reads the `nid_demo_tour_seen`
 * localStorage flag and auto-opens only if the flag is absent. The flag is set
 * when the tour is dismissed (Skip) or completed (Done), so it never re-opens on
 * its own. The separately exported `TourTrigger` ("Take a tour") re-opens it on
 * demand, ignoring the flag — a returning recruiter can always replay it.
 *
 * No server writes: the only persisted state is the client-side seen-flag.
 * Reduced-motion is honoured by `Overlay` (its enter motion is zeroed via the
 * `--motion-modal` token under `prefers-reduced-motion`), so nothing extra is
 * needed here. Presentation reads semantic design tokens only.
 *
 * Client component — owns local open/step state and touches localStorage.
 *
 * Exports:
 *   - `DashboardTour`  default-mounted on the dashboard; self-opens on first visit.
 *   - `TourTrigger`    a "Take a tour" button that opens the tour on demand.
 */

/** localStorage key marking the tour as already seen (set on Skip or Done). */
const SEEN_KEY = 'nid_demo_tour_seen';

interface TourStep {
  /** Short rail label for the `ProgressTracker` (kept to ~2 words). */
  readonly railLabel: string;
  /** The step kicker — the surface being explained. */
  readonly kicker: string;
  /** The step's headline. */
  readonly title: string;
  /** One or two short sentences of sandboxed explainer copy. */
  readonly body: string;
  /** A small pill that names the one governing rule for this surface. */
  readonly rule: { readonly tone: StatusTone; readonly text: string };
}

/**
 * The seven steps, in dashboard order. Copy is intentionally terse and demo-aware
 * — each step pairs "what this is" with the single non-negotiable that shapes it
 * (CI gate, individual-only evaluation, immutable JDs, wave cascade, no AI
 * ranking, concierge scheduling). These mirror the dashboard's own sections.
 */
const STEPS: readonly TourStep[] = [
  {
    railLabel: 'Dashboard',
    kicker: 'Step 1 · Your dashboard',
    title: 'Start here — your cycle at a glance',
    body: 'The header tag shows where the active placement cycle stands today, and the rolling banner carries every live deadline. Your JD counts (drafts, in-moderation, published) sit right below.',
    rule: { tone: 'info', text: 'Live cycle status' },
  },
  {
    railLabel: 'Post a JD',
    kicker: 'Step 2 · Post a JD',
    title: 'Publish a role through the gate',
    body: 'A new JD runs the wizard, then a pre-publish check: the stipend floor is verified at both ends of the range before it can go to moderation. Think of it as a CI pipeline for your posting.',
    rule: { tone: 'warning', text: 'Stipend-floor gate' },
  },
  {
    railLabel: 'Candidates',
    kicker: 'Step 3 · Browse candidates',
    title: 'Portfolios first, one student at a time',
    body: 'Candidates surface portfolio-first, never as a ranked list. You evaluate each student individually and leave a note — there is no bulk shortlist and no demographic sort.',
    rule: { tone: 'success', text: 'Individual evaluation only' },
  },
  {
    railLabel: 'Interviews',
    kicker: 'Step 4 · Slots & interview day',
    title: 'Book slots, run the day from your phone',
    body: 'Pick from the slots the placement cell publishes, then work the interview-day console on mobile — mark students seen, paste your own joining link, and keep the queue moving.',
    rule: { tone: 'info', text: 'You host the call link' },
  },
  {
    railLabel: 'Offers',
    kicker: 'Step 5 · Offers',
    title: 'Roll out offers in waves',
    body: 'Offers go out as timed waves: a student gets a window to respond before the next candidate is reached, so the cascade stays orderly and fair to everyone in line.',
    rule: { tone: 'success', text: 'Wave cascade' },
  },
  {
    railLabel: 'Your stats',
    kicker: 'Step 6 · Your stats',
    title: 'See how your participation reads',
    body: 'Your stats roll up posting, response, and turnaround into a single health-score band. It reflects conduct only — never any AI judgement of students — and tells you where to tighten up.',
    rule: { tone: 'info', text: 'Health-score band' },
  },
  {
    railLabel: 'Concierge',
    kicker: 'Step 7 · Concierge',
    title: 'Talk to your placement head',
    body: 'Stuck or unsure? Schedule a short meeting with the campus placement head straight from the dashboard. They own the cycle and can unblock anything the portal cannot.',
    rule: { tone: 'success', text: 'Schedule a meeting' },
  },
];

interface DashboardTourViewProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * The presentational tour shell — `Overlay` + step rail + body + controls.
 * Step index is local; opening always restarts at step 0 (see the open effect)
 * so a re-triggered tour reads from the top. Visited steps (every index up to
 * and including the current one) render as `done` on the rail.
 */
function DashboardTourView({ open, onClose }: DashboardTourViewProps) {
  const [index, setIndex] = useState(0);

  // Every fresh open restarts the walkthrough at the first step.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const step = STEPS[index]!;

  // Visited = current and everything before it; the rail shows them as done.
  const railSteps = STEPS.map((s, i) => ({
    id: s.railLabel,
    label: s.railLabel,
    done: i <= index,
  }));

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(STEPS.length - 1, i + 1)),
    [],
  );

  return (
    <Overlay open={open} onClose={onClose} title="Take a tour" width="min(880px, 96vw)">
      <div style={layoutStyle}>
        {/* Step rail — visited steps render as done. */}
        <div style={railColStyle}>
          <ProgressTracker
            steps={railSteps}
            orientation="vertical"
            title="Tour progress"
            ariaLabel="Tour progress"
          />
        </div>

        {/* Active step. */}
        <div style={panelColStyle}>
          <div style={stepBodyStyle}>
            <p style={kickerStyle}>{step.kicker}</p>
            <h3 style={stepTitleStyle}>{step.title}</h3>
            <p style={stepCopyStyle}>{step.body}</p>
            <div style={ruleRowStyle}>
              <StatusPill tone={step.rule.tone}>{step.rule.text}</StatusPill>
            </div>
          </div>

          {/* Controls: Skip always; Back from step 2; Next, then Done on the last. */}
          <div style={controlsStyle}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
            <div style={controlsRightStyle}>
              {!isFirst && (
                <Button variant="secondary" size="sm" onClick={back}>
                  Back
                </Button>
              )}
              {isLast ? (
                <Button size="sm" onClick={onClose}>
                  Done
                </Button>
              ) : (
                <Button size="sm" onClick={next}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/**
 * DashboardTour — mount once on the dashboard. Self-opens on first visit (when
 * `nid_demo_tour_seen` is absent) and writes the flag on close, so it shows
 * exactly once unless replayed via `TourTrigger`.
 */
export function DashboardTour() {
  const [open, setOpen] = useState(false);

  // First-visit auto-open. Reads localStorage after mount (SSR-safe). A read
  // failure (private mode, blocked storage) simply skips the auto-open.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY) == null) {
        setOpen(true);
      }
    } catch {
      // Storage unavailable — don't force the tour open.
    }
  }, []);

  // Closing (Skip or Done) marks the tour seen so it won't auto-open again.
  const close = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Best-effort: if we can't persist, the tour may reappear next visit.
    }
  }, []);

  return <DashboardTourView open={open} onClose={close} />;
}

/**
 * TourTrigger — a "Take a tour" button for the dashboard header. Opens the tour
 * on demand and ignores the seen-flag (a returning recruiter can always replay),
 * and does NOT set the flag, so an in-progress first-visit gate is untouched.
 */
export function TourTrigger({ label = 'Take a tour' }: { readonly label?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <DashboardTourView open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ── Styles (tokens only) ─────────────────────────────────────────────────────

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 200px) minmax(0, 1fr)',
  gap: 'var(--space-6)',
  alignItems: 'start',
};

const railColStyle: CSSProperties = {
  // The rail collapses under the panel on narrow screens via the media-free
  // min() column above; keeping it first preserves reading order for AT.
  minWidth: 0,
};

const panelColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
  minWidth: 0,
};

const stepBodyStyle: CSSProperties = {
  minHeight: '180px',
};

const kickerStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const stepTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-24)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  margin: 0,
};

const stepCopyStyle: CSSProperties = {
  fontSize: 'var(--fs-16)',
  lineHeight: 'var(--lh-28)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginTop: 'var(--space-3)',
  marginBottom: 0,
  maxWidth: '52ch',
};

const ruleRowStyle: CSSProperties = {
  marginTop: 'var(--space-4)',
};

const controlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--border-default)',
};

const controlsRightStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
};
