import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import type { CSSProperties } from 'react';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import { listForRecruiter, type JdRecord } from '@nid/module-jd-posting';
import {
  verifiedStrikeCount,
  BLACKLIST_STRIKE_THRESHOLD,
} from '@nid/module-admin-accountability';
import { isAccountLocked } from '@nid/module-recruiter-onboarding';
import { getStage, type PipelineStage } from '@nid/module-recruiter-pipeline';
import { listShortlist } from '@nid/module-candidate-browse';
import { tallyFor } from '@nid/module-offer-cascade';
import {
  getExperienceRating,
  type ExperienceRating,
} from '@nid/module-recruiter-engagement';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { ExperienceWidget } from './ExperienceWidget';
import { submitExperienceRatingAction } from './experience-actions';
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
import { DashboardTour, TourTrigger } from '~/components/DashboardTour';

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
 * The cycle a locked recruiter reactivates into — the `upcoming` current-year
 * cycle's label (e.g. "Autumn 2026"), or a neutral "the next cycle" when no
 * upcoming cycle is seeded. Used only by the locked panel's CTA copy.
 */
function nextCycleLabel(): string {
  return CURRENT_CYCLES.find((c) => c.status === 'upcoming')?.label ?? 'the next cycle';
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

/**
 * The pipeline-stage tag for a JD's card in the "Your pipelines" band — a short
 * human label + a `StatusPill` tone, mirroring `phaseTagLabel`'s shape. The
 * recruiter-pipeline stage is the source of truth for "which stage are we in"
 * (Round 4 §B); this only maps the seven forward-only stages to display copy.
 * Tone walks neutral → info → success as the JD moves toward letters-out.
 */
function pipelineStageLabel(stage: PipelineStage): {
  tone: 'info' | 'success' | 'neutral';
  text: string;
} {
  switch (stage) {
    case 'published':
      return { tone: 'neutral', text: 'Awaiting shortlist' };
    case 'shortlisting':
      return { tone: 'info', text: 'Shortlisting' };
    case 'plan-locked':
      return { tone: 'info', text: 'Interview plan locked' };
    case 'interviewing':
      return { tone: 'info', text: 'Interviewing' };
    case 'tallied':
      return { tone: 'info', text: 'Tallied — selecting' };
    case 'offer-sequencing':
      return { tone: 'success', text: 'Floating offers' };
    case 'letters-out':
      return { tone: 'success', text: 'Letters out' };
  }
}

/**
 * The workspace a JD's card deep-links into, chosen by its pipeline stage so the
 * card always lands the recruiter on the most relevant linear step:
 * early stages → Candidates, the interview run → Interview, the offer phase →
 * Offers. Each preserves the `?jd=` filter the workspaces read. The metric rows
 * also carry their own per-workspace deep-links; this is the card's headline
 * destination.
 */
function workspaceHrefForStage(stage: PipelineStage, jdId: string): string {
  const jd = encodeURIComponent(jdId);
  switch (stage) {
    case 'published':
    case 'shortlisting':
      return `/recruiter/candidates?jd=${jd}`;
    case 'plan-locked':
    case 'interviewing':
    case 'tallied':
      return `/recruiter/interviews?jd=${jd}`;
    case 'offer-sequencing':
    case 'letters-out':
      return `/recruiter/offers?jd=${jd}`;
  }
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

/** The plain, serializable view a "Your pipelines" card renders. */
interface PipelineCard {
  readonly jdId: string;
  readonly title: string;
  readonly location: string;
  readonly positions: number;
  readonly shortlisted: number;
  readonly stage: PipelineStage;
  readonly filled: number;
  readonly href: string;
}

/**
 * Assemble one published JD's pipeline card from its owning modules: the
 * recruiter-pipeline stage, the candidate-browse shortlist count, and the
 * offer-cascade tally (`filled` = accepted offers). Server-Component-only — it
 * touches module stores directly and returns a plain object the (client-free)
 * card markup renders. The deep-link routes to the workspace that matches the
 * JD's current stage, carrying `?jd=`.
 */
function buildPipelineCard(jd: JdRecord): PipelineCard {
  const stage = getStage(jd.id);
  const shortlisted = listShortlist(jd.id).length;
  const tally = tallyFor(jd.id, jd.positions);
  return {
    jdId: jd.id,
    title: jd.title,
    location: jd.location,
    positions: jd.positions,
    shortlisted,
    stage,
    filled: tally.filled,
    href: workspaceHrefForStage(stage, jd.id),
  };
}

export default async function RecruiterDashboard() {
  const recruiter = await readRecruiterSession();

  // Cycle wind-down (plan Round 3 §C): once an admin winds down the recruiter's
  // active cycle, the account locks. We keep the shell (so the account menu /
  // Log Out still works) but swap the whole dashboard body for a locked panel
  // that routes to re-payment. The normal dashboard below never renders while
  // locked, so none of its per-recruiter reads run.
  if (isAccountLocked(recruiter.recruiterId)) {
    return (
      <RecruiterShell
        activeNav="dashboard"
        companyName={recruiter.companyName}
        accountMenu={<RecruiterAccountMenu companyName={recruiter.companyName} />}
      >
        <LockedPanel nextCycleLabel={nextCycleLabel()} />
      </RecruiterShell>
    );
  }

  const jds = listForRecruiter(recruiter.recruiterId);
  const drafts = jds.filter((j) => j.status === 'draft').length;
  const inModeration = jds.filter((j) => j.status === 'in-moderation').length;
  const publishedJds = jds.filter((j) => j.status === 'published');
  const published = publishedJds.length;

  // "Your pipelines" band (Round 4 §E): one card per published JD with its
  // shortlist count, linear pipeline stage, and offer fill. The pipeline stage
  // comes from the recruiter-pipeline module (the source of truth for "which
  // stage are we in"); shortlist + tally come from their owning modules. All
  // reads are per published JD only — no read runs while the account is locked
  // (that path returned above).
  const pipelines = publishedJds.map((jd) => buildPipelineCard(jd));

  // Recruiter experience rating (Round 4 §E) — the session recruiter's existing
  // portal rating, surfaced read-only with an edit affordance in the widget.
  const experience: ExperienceRating | null = getExperienceRating(recruiter.recruiterId);

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
      accountMenu={<RecruiterAccountMenu companyName={recruiter.companyName} />}
      phaseTag={<StatusPill tone={tag.tone}>{tag.text}</StatusPill>}
      banner={<DashboardBanner lines={lines} />}
    >
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* First-visit tour — self-gates on the nid_demo_tour_seen flag. */}
          <DashboardTour />

          <p style={cycleKickerStyle}>{cycle.label} cycle</p>
          <div style={welcomeRowStyle}>
            <h1 style={welcomeTitleStyle}>Welcome back</h1>
            {/* On-demand replay of the walkthrough; ignores the seen-flag. */}
            <TourTrigger />
          </div>

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

          {/* Your pipelines — one card per published JD walking the linear stage
              machine (shortlist → interview → offers). Only renders for active
              accounts; the locked path returned above. */}
          {pipelines.length > 0 && (
            <div style={bandStyle}>
              <p style={sectionLabelStyle}>Your pipelines</p>
              <div style={pipelineGridStyle}>
                {pipelines.map((card) => (
                  <PipelineCardView key={card.jdId} card={card} />
                ))}
              </div>
            </div>
          )}

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

          {/* How is your experience? — recruiter rates the portal (Round 4 §E).
              The client widget receives the existing rating as plain props and
              the server action injected; it never imports a store. */}
          <div style={bandStyle}>
            <p style={sectionLabelStyle}>How is your experience?</p>
            <p style={experienceLeadStyle}>
              Tell us how the placement portal is working for you. This is feedback on the tool —
              never a rating of any student.
            </p>
            <ExperienceWidget
              recruiterId={recruiter.recruiterId}
              currentStars={experience ? experience.stars : null}
              {...(experience?.comment !== undefined ? { currentComment: experience.comment } : {})}
              {...(experience?.ratedAt !== undefined ? { ratedAt: experience.ratedAt } : {})}
              action={submitExperienceRatingAction}
            />
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

/**
 * One JD's pipeline card in the "Your pipelines" band. A whole-card link into
 * the stage-appropriate workspace (`?jd=`), surfacing three at-a-glance metrics:
 * shortlisted count, the linear pipeline stage (a `StatusPill`), and offers
 * `{filled}/{positions}` with a mini progress bar. Pure server markup — no
 * client island, no store import (the page assembled the plain `card`).
 */
function PipelineCardView({ card }: { card: PipelineCard }) {
  const stageTag = pipelineStageLabel(card.stage);
  const pct =
    card.positions > 0 ? Math.min(100, Math.round((card.filled / card.positions) * 100)) : 0;
  return (
    <a href={card.href} style={pipelineCardStyle}>
      <div style={pipelineCardHeadStyle}>
        <h3 style={pipelineTitleStyle}>{card.title}</h3>
        {card.location && <p style={pipelineLocationStyle}>{card.location}</p>}
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <StatusPill tone={stageTag.tone}>{stageTag.text}</StatusPill>
      </div>

      <dl style={pipelineMetricsStyle}>
        <div style={pipelineMetricStyle}>
          <dt style={pipelineMetricLabelStyle}>Shortlisted</dt>
          <dd style={pipelineMetricValueStyle}>{card.shortlisted}</dd>
        </div>
        <div style={pipelineMetricStyle}>
          <dt style={pipelineMetricLabelStyle}>Offers filled</dt>
          <dd style={pipelineMetricValueStyle}>
            {card.filled}
            <span style={pipelineMetricMutedStyle}>/{card.positions}</span>
          </dd>
        </div>
      </dl>

      {/* Offer-fill progress — purely visual reflection of {filled}/{positions}. */}
      <div
        style={progressTrackStyle}
        role="progressbar"
        aria-valuenow={card.filled}
        aria-valuemin={0}
        aria-valuemax={card.positions}
        aria-label={`${card.filled} of ${card.positions} positions filled`}
      >
        <div style={{ ...progressFillStyle, width: `${pct}%` }} />
      </div>

      <span style={pipelineOpenStyle}>Open workspace →</span>
    </a>
  );
}

/**
 * LockedPanel — the dashboard body shown when the recruiter's account is locked
 * after a cycle wind-down (plan Round 3 §C). States plainly that the cycle has
 * closed and company details are kept on file, then offers a single re-pay CTA
 * to `/recruiter/reactivate`. No JD stats, tools, or contacts render while
 * locked — only this panel inside the (still-functional) shell.
 */
function LockedPanel({ nextCycleLabel }: { nextCycleLabel: string }) {
  return (
    <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
      <div style={lockedWrapStyle}>
        <p style={lockedKickerStyle}>Account locked</p>
        <h1 style={lockedTitleStyle}>This placement cycle has closed</h1>
        <p style={lockedBodyStyle}>
          Your dashboard is locked between placement cycles. Your company details are kept on file —
          nothing has been deleted. Reactivate by paying the participation fee for {nextCycleLabel} and
          your existing login continues to work.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/recruiter/reactivate" style={{ textDecoration: 'none' }}>
            <Button size="lg">Reactivate for {nextCycleLabel} — pay participation fee (₹15,000)</Button>
          </a>
        </div>
        <p style={lockedNoteStyle}>
          The participation fee is non-refundable once the cycle opens. Need help? Your campus placement
          head can confirm cycle dates and re-activation.
        </p>
      </div>
    </section>
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

/** Welcome heading + "Take a tour" trigger on one baseline-aligned row. */
const welcomeRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-6)',
};

/** The page heading inside the welcome row — the row owns the bottom margin. */
const welcomeTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  margin: 0,
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

// ── "Your pipelines" band styles ─────────────────────────────────────────────

const pipelineGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'var(--space-4)',
};

const pipelineCardStyle: CSSProperties = {
  display: 'block',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
  textDecoration: 'none',
  color: 'inherit',
};

const pipelineCardHeadStyle: CSSProperties = {
  marginBottom: 'var(--space-3)',
};

const pipelineTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  margin: 0,
};

const pipelineLocationStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  marginTop: 'var(--space-1)',
};

const pipelineMetricsStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-6)',
  margin: 0,
  marginBottom: 'var(--space-3)',
};

const pipelineMetricStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-1)',
};

const pipelineMetricLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const pipelineMetricValueStyle: CSSProperties = {
  fontSize: 'var(--fs-24)',
  lineHeight: 1,
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
  margin: 0,
};

const pipelineMetricMutedStyle: CSSProperties = {
  fontSize: 'var(--fs-16)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-secondary)',
};

const progressTrackStyle: CSSProperties = {
  height: '6px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  overflow: 'hidden',
  marginBottom: 'var(--space-3)',
};

const progressFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--accent)',
  transition: 'width var(--motion-micro)',
};

const pipelineOpenStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
};

const experienceLeadStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  maxWidth: '560px',
  marginBottom: 'var(--space-4)',
};

// ── Locked-panel styles ──────────────────────────────────────────────────────

const lockedWrapStyle: CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding-loose)',
  boxShadow: 'var(--card-shadow)',
};

const lockedKickerStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};

const lockedTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-4)',
};

const lockedBodyStyle: CSSProperties = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-8)',
};

const lockedNoteStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--space-8)',
};
