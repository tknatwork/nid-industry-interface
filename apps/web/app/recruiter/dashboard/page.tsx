import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import {
  verifiedStrikeCount,
  BLACKLIST_STRIKE_THRESHOLD,
} from '@nid/module-admin-accountability';
import { readRecruiterSession } from '~/lib/recruiter-session';
import {
  cyclePhase,
  parseActivityDates,
  type CycleActivity,
  type CyclePhase,
} from '~/lib/cycle-phase';
import {
  CURRENT_CYCLES,
  type Cycle,
  type DateSpan,
} from '~/lib/public-content';
import {
  PLACEMENT_HEADS,
  GUIDELINES,
  coordinatorForRecruiter,
  type PlacementHead,
  type CoordinatorWithCampus,
} from '~/lib/recruiter-public';
import { PlacementTimetable } from '~/components/PlacementTimetable';
import {
  DashboardBanner,
  BrochureCTA,
  StrikeTag,
  PingButton,
} from '~/components/DashboardOverlays';

export const metadata: Metadata = {
  title: 'Dashboard · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

/** Months for the short "1 Jun" phase-tag / banner date labels. */
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1 Jun" — the compact date the phase tag and banner lines use. */
function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** The open cycle drives the phase tag + banner; fall back to the first current cycle. */
function activeCycle(): Cycle {
  return CURRENT_CYCLES.find((c) => c.status === 'open') ?? CURRENT_CYCLES[0]!;
}

/**
 * Turn the open cycle's five activity spans into `CycleActivity[]` for the pure
 * `cyclePhase` resolver. Each span's start/end strings are parsed via the helper
 * (`parseActivityDates`); malformed/absent spans are skipped so the resolver
 * only ever sees real windows.
 */
function cycleActivities(cycle: Cycle): readonly CycleActivity[] {
  const a = cycle.activities;
  const defs: ReadonlyArray<{ key: string; label: string; span: DateSpan }> = [
    { key: 'applications', label: 'Applications', span: a.applications },
    { key: 'jd-deadline', label: 'JD upload', span: a.jdDeadline },
    { key: 'browsing', label: 'Browsing', span: a.browsing },
    { key: 'interview-window', label: 'Interviews', span: a.interviewWindow },
    { key: 'offers', label: 'Offers', span: a.offers },
  ];

  const out: CycleActivity[] = [];
  for (const def of defs) {
    const window = spanToWindow(def.span);
    if (window) out.push({ key: def.key, label: def.label, ...window });
  }
  return out;
}

/**
 * Parse a {start,end} display span into a single inclusive window. We parse each
 * endpoint string with `parseActivityDates` (which itself returns a window) and
 * take the start of the first and the end of the second, so a two-date span like
 * `{ '01 Jun 2026', '05 Jun 2026' }` becomes 1 Jun .. 5 Jun.
 */
function spanToWindow(span: DateSpan): { start: Date; end: Date } | null {
  const start = parseActivityDates(span.start);
  const end = parseActivityDates(span.end);
  if (!start || !end) return null;
  return { start: start.start, end: end.end };
}

/**
 * The top-right phase-tag label, e.g. "Interviews · Day 2 · 2 Jun" while a phase
 * is live, or "Next: Interviews opens 1 Jun · 2 days" in a between-phases lull.
 * The live form is driven by cyclePhase(...) at runtime; today (late May 2026)
 * falls inside browsing (23–31 May), so this renders the active-phase form
 * (e.g. "Browsing · Day 8 · 30 May"), not the next-deadline form.
 */
function phaseTagLabel(phase: CyclePhase): { tone: 'info' | 'success' | 'neutral'; text: string } {
  if (phase.activePhase) {
    const dayNo = Math.max(1, daysInclusive(phase.activePhase.start, phase.today));
    return {
      tone: 'success',
      text: `${phase.activePhase.label} · Day ${dayNo} · ${shortDate(phase.today)}`,
    };
  }
  if (phase.nextDeadline) {
    const verb = phase.nextDeadline.boundary === 'start' ? 'opens' : 'by';
    const days = phase.nextDeadline.daysRemaining;
    const dayLabel = days === 0 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`;
    return {
      tone: 'info',
      text: `Next: ${phase.nextDeadline.label} ${verb} ${shortDate(phase.nextDeadline.date)} · ${dayLabel}`,
    };
  }
  return { tone: 'neutral', text: `${activeCycle().label} · cycle complete` };
}

/** Whole days from `from` to `to`, inclusive of both ends (Day 1 = the start day). */
function daysInclusive(from: Date, to: Date): number {
  const ms = startOfDayMs(to) - startOfDayMs(from);
  return Math.floor(ms / 86_400_000) + 1;
}

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * The rolling banner's time-bound lines: every still-future activity boundary of
 * the open cycle (opens/closes + day countdown), plus two standing reminders
 * drawn from GUIDELINES so the strip always carries policy context. Past
 * boundaries are dropped so the banner never advertises a lapsed deadline.
 */
function bannerLines(cycle: Cycle, phase: CyclePhase): readonly string[] {
  const today = phase.today;
  const lines: string[] = [];

  for (const act of cycleActivities(cycle)) {
    if (act.start.getTime() > today.getTime()) {
      lines.push(`${act.label} opens ${shortDate(act.start)} (${countdown(act.start, today)})`);
    } else if (act.end.getTime() >= today.getTime()) {
      lines.push(`${act.label} closes ${shortDate(act.end)} (${countdown(act.end, today)})`);
    }
  }

  // Two standing policy reminders from GUIDELINES (headings only — concise on a
  // single scrolling line). Keeps the banner useful even late in the cycle.
  const conduct = GUIDELINES.find((g) => g.heading === 'Conduct during the cycle');
  if (conduct) lines.push('Evaluate students individually — no bulk shortlist');
  const jdRules = GUIDELINES.find((g) => g.heading === 'Job-description structure');
  if (jdRules) lines.push('Published JDs are immutable — corrections chain to a new JD');

  return lines;
}

/** "in 2 days" / "today" / "in 1 day" countdown phrase to a boundary date. */
function countdown(target: Date, today: Date): string {
  const days = Math.round((startOfDayMs(target) - startOfDayMs(today)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'in 1 day';
  return `in ${days} days`;
}

export default async function RecruiterDashboard() {
  const recruiter = await readRecruiterSession();

  const jds = listForRecruiter(recruiter.recruiterId);
  const drafts = jds.filter((j) => j.status === 'draft').length;
  const inModeration = jds.filter((j) => j.status === 'in-moderation').length;
  const published = jds.filter((j) => j.status === 'published').length;

  // Cycle phase drives the top-right tag + the rolling banner. `cyclePhase` is a
  // pure function; production callers pass `new Date()` (per the helper's docs).
  const cycle = activeCycle();
  const phase = cyclePhase(cycleActivities(cycle), new Date());
  const tag = phaseTagLabel(phase);
  const lines = bannerLines(cycle, phase);

  // Verified-strike tag (admin-upheld redressals only; pending reports excluded).
  const strikes = verifiedStrikeCount(recruiter.recruiterId);

  // Contacts: the campus placement head + this recruiter's assigned coordinator.
  const coordinator = coordinatorForRecruiter(recruiter.recruiterId);
  const placementHead = coordinator
    ? PLACEMENT_HEADS.find((h) => h.campus === coordinator.campus) ?? PLACEMENT_HEADS[0]!
    : PLACEMENT_HEADS[0]!;

  return (
    <RecruiterShell
      activeNav="dashboard"
      companyName={recruiter.companyName}
      phaseTag={<StatusPill tone={tag.tone}>{tag.text}</StatusPill>}
      banner={<DashboardBanner lines={lines} />}
    >
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p style={cycleKickerStyle}>{cycle.label} cycle</p>
          <h1 style={pageTitleStyle}>Welcome back</h1>

          <div style={statGridStyle}>
            <StatCard label="Drafts" value={drafts} />
            <StatCard label="In moderation" value={inModeration} />
            <StatCard label="Published" value={published} />
            <StatCard label="Total JDs" value={jds.length} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <a href="/recruiter/jds/new" style={{ textDecoration: 'none' }}>
              <Button size="lg">Post a new JD</Button>
            </a>
            <a href="/recruiter/jds" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="secondary">
                View your JDs
              </Button>
            </a>
          </div>

          {/* Placement timetable — the at-a-glance schedule, carried into the dashboard. */}
          <div style={bandStyle}>
            <PlacementTimetable compact />
          </div>

          {/* Discipline brochures — CTA opens the tabbed brochure in an overlay. */}
          <div style={bandStyle}>
            <BrochureCTA />
          </div>

          {/* Contacts — campus placement head + assigned student coordinator. */}
          <div style={bandStyle}>
            <div style={contactsHeaderStyle}>
              <p style={sectionLabelStyle}>Your contacts</p>
              <StrikeTag strikes={strikes} threshold={BLACKLIST_STRIKE_THRESHOLD} />
            </div>
            <div style={contactsGridStyle}>
              <PlacementHeadCard head={placementHead} />
              <CoordinatorCard coordinator={coordinator} campus={placementHead.campus} />
            </div>
          </div>

          {/* More tools — Analytics dropped (merged into Stats). */}
          <div style={bandStyle}>
            <p style={sectionLabelStyle}>More tools</p>
            <div style={moreToolsStyle}>
              {MORE_TOOLS.map(([href, text]) => (
                <a key={href} href={href} style={moreToolLinkStyle}>
                  {text} →
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

/**
 * "More tools" entries. Analytics is intentionally absent (merged into Stats per
 * plan §K); the new "Profile & setup" link points at the setup overview (§L).
 */
const MORE_TOOLS: ReadonlyArray<readonly [string, string]> = [
  ['/recruiter/profile', 'Profile & setup'],
  ['/recruiter/calculator', 'Stipend calculator'],
  ['/recruiter/candidates', 'Browse candidates'],
  ['/recruiter/ppt', 'Pre-Placement Talks'],
  ['/recruiter/meetings', 'Meet placement head'],
  ['/recruiter/stats', 'Your stats'],
  ['/recruiter/integrations', 'API & alerts'],
];

function PlacementHeadCard({ head }: { head: PlacementHead }) {
  return (
    <article style={contactCardStyle}>
      <p style={contactRoleStyle}>Placement head · {head.campus}</p>
      <p style={contactNameStyle}>{head.name}</p>
      <p style={contactBioStyle}>{head.bio}</p>
      <a href={`mailto:${head.email}`} style={contactEmailStyle}>
        {head.email}
      </a>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <PingButton name={head.name} role="placement head" />
      </div>
    </article>
  );
}

function CoordinatorCard({
  coordinator,
  campus,
}: {
  coordinator: CoordinatorWithCampus | null;
  campus: string;
}) {
  if (!coordinator) {
    return (
      <article style={contactCardStyle}>
        <p style={contactRoleStyle}>Student coordinator · {campus}</p>
        <p style={contactNameStyle}>Not yet assigned</p>
        <p style={contactBioStyle}>
          A student coordinator is assigned once your participation is confirmed for the cycle. They
          run on-the-day interview coordination and the company onboarding group.
        </p>
      </article>
    );
  }
  return (
    <article style={contactCardStyle}>
      <p style={contactRoleStyle}>Student coordinator · {coordinator.campus}</p>
      <p style={contactNameStyle}>{coordinator.name}</p>
      <p style={contactBioStyle}>
        Your day-of-interview point of contact — runs the company onboarding group, hands off at the
        PPT, and coordinates if interview slots run late.
      </p>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <PingButton name={coordinator.name} role="coordinator" />
      </div>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCardStyle}>
      <p style={statValueStyle}>{value}</p>
      <p style={statLabelStyle}>{label}</p>
    </div>
  );
}

// ── Styles (tokens only) ─────────────────────────────────────────────────────

const cycleKickerStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const pageTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-6)',
};

const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-8)',
};

const bandStyle: CSSProperties = {
  marginTop: 'var(--space-10)',
  paddingTop: 'var(--space-6)',
  borderTop: '1px solid var(--border-default)',
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};

const contactsHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-4)',
};

const contactsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--space-4)',
};

const contactCardStyle: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};

const contactRoleStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 'var(--space-2)',
};

const contactNameStyle: CSSProperties = {
  fontSize: 'var(--fs-20)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-2)',
};

const contactBioStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-3)',
};

const contactEmailStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textDecoration: 'none',
};

const moreToolsStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-5)',
  flexWrap: 'wrap',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
};

const moreToolLinkStyle: CSSProperties = {
  color: 'var(--accent)',
  textDecoration: 'none',
};

const statCardStyle: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};

const statValueStyle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 1,
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
};

const statLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: 'var(--space-2)',
};
