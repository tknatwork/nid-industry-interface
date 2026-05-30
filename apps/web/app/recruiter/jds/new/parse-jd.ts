/**
 * Deterministic demo "JD parser" for the wizard's *Upload your JD* control
 * (plan §N). A recruiter who already wrote a JD elsewhere drops it in; the
 * wizard prefills every field it can read, then pops up the remaining mandatory
 * blanks so the recruiter only fills the gaps.
 *
 * Two layers, in priority order:
 *
 *  1. **Optional ML extract** — a best-effort POST to the Python worker's
 *     `/ml/jd/extract` (the discipline-mapping / extraction endpoint flagged as
 *     a later slice in `services/ml-jd-analyzer`). If it is reachable AND
 *     returns a shape we can validate, we use it. It is *not* required: the
 *     endpoint may not exist yet, so a non-200, a timeout, or a schema mismatch
 *     all fall through silently.
 *
 *  2. **Deterministic local mapper** — the demo's authoritative path. A small
 *     keyword/section parser over the pasted/sample text that maps to the
 *     canonical skill slugs, the five responsibility phases, role-type, work
 *     mode, programmes, and compensation. Pure and synchronous, so the demo
 *     produces the same prefill every time with no network dependency.
 *
 * AI posture (root CLAUDE.md): this is a *translator*, never a judge. It only
 * maps free text onto the structured schema the recruiter then edits and
 * confirms. It never scores, ranks, or filters anyone, and the recruiter owns
 * every field after the prefill.
 *
 * Client-safe: no `next/headers`, no server-only imports. Runs in the wizard
 * ('use client') so the upload→prefill round-trip needs no server action.
 */

import {
  CANONICAL_SKILLS,
  isInternshipRoleType,
  type CanonicalSkill,
} from '@nid/module-jd-posting/client';

export type ParsedRoleType =
  | 'full-time'
  | 'vacation-internship'
  | 'during-course-internship';
export type ParsedWorkMode = 'onsite' | 'remote' | 'hybrid';
export type ParsedSkillState = 'preferred' | 'required';

/**
 * The structured prefill the parser hands back. Every field is optional: the
 * wizard merges whatever was found and leaves the rest blank (then nudges the
 * recruiter to complete the mandatory ones). Compensation is in **rupees**
 * (what the form inputs hold), not paise — the wizard converts on submit.
 */
export interface ParsedJd {
  readonly title?: string;
  readonly roleType?: ParsedRoleType;
  readonly location?: string;
  readonly workMode?: ParsedWorkMode;
  readonly positions?: number;
  /** Annual CTC range (full-time), rupees. */
  readonly baseMinRupees?: number;
  readonly baseMaxRupees?: number;
  /** Monthly stipend (internships), rupees. */
  readonly stipendRupees?: number;
  readonly programmes?: { readonly bachelors: boolean; readonly masters: boolean };
  /** slug → required|preferred for skills detected in the text. */
  readonly skills?: Readonly<Record<string, ParsedSkillState>>;
  /** phase key → newline-joined responsibility lines. */
  readonly responsibilities?: Readonly<Record<string, string>>;
  /** Newline-joined deliverables. */
  readonly deliverables?: string;
  /** Free narrative the recruiter can keep or trim. */
  readonly supplementaryProse?: string;
  /** Round focuses parsed from an "interview" section. */
  readonly interviewRounds?: readonly string[];
  /** Provenance, surfaced in the post-parse summary. */
  readonly source: 'analyzer' | 'sample';
}

/**
 * A bundled sample JD. In the demo, the *Upload your JD* control doesn't read a
 * real file — it loads this representative document and runs it through the
 * deterministic mapper, so the prefill is identical on every machine and needs
 * no file picker plumbing. It deliberately leaves a few mandatory fields thin
 * (e.g. positions, exact location) so the "remaining blanks" pop-up has
 * something to ask for.
 */
export const SAMPLE_JD_TEXT = `Senior Product Designer — Acme Design Studio

Type: Full-time
Work mode: Hybrid (Bengaluru studio, 3 days on-site)
Open to: M.Des and B.Des graduates
Compensation: ₹9,00,000 – ₹14,00,000 per annum

About the role
We are looking for a senior product designer to own end-to-end product
experiences across our consumer apps. You will partner closely with research,
engineering, and product to ship considered, accessible interfaces.

Responsibilities
Discovery
- Run generative and evaluative user research with the research team
- Synthesise findings into clear, actionable insights
Definition
- Frame problems and define success metrics with product partners
- Map information architecture for new product areas
Design
- Produce high-fidelity visual and interaction design in Figma
- Build and extend our design system components
Delivery
- Prototype flows and validate them through usability testing
- Partner with engineering on faithful implementation (HTML/CSS literacy a plus)

Skills we value
User research, design strategy, interaction design, design systems, prototyping,
visual design, typography, accessibility, Figma. Familiarity with HTML/CSS is a
bonus but not required.

Deliverables
- A validated end-to-end flow for one consumer surface
- Reusable design-system components adopted by at least one other team
- A research synthesis the wider org can act on

Interview process
- Portfolio review
- Design exercise debrief
- Team and craft conversation`;

// ── deterministic mapper ────────────────────────────────────────────────────

interface SkillMatcher {
  readonly slug: string;
  /** Lowercased phrases that, if present, mark this skill. */
  readonly cues: readonly string[];
}

/** Build per-skill cue lists from the canonical taxonomy + a few synonyms. */
function buildMatchers(skills: readonly CanonicalSkill[]): readonly SkillMatcher[] {
  const synonyms: Readonly<Record<string, readonly string[]>> = {
    'user-research': ['user research', 'generative research', 'evaluative research'],
    'design-strategy': ['design strategy', 'strategy'],
    'usability-testing': ['usability testing', 'usability test'],
    'service-design': ['service design', 'service blueprint'],
    'visual-design': ['visual design', 'visual'],
    typography: ['typography', 'type'],
    illustration: ['illustration'],
    'motion-design': ['motion design', 'motion'],
    'industrial-form': ['industrial', 'form-giving', 'product form'],
    'textile-surface': ['textile', 'surface design'],
    photography: ['photography'],
    'design-systems': ['design system', 'design systems'],
    'interaction-design': ['interaction design'],
    'information-architecture': ['information architecture', 'ia '],
    accessibility: ['accessibility', 'wcag', 'a11y'],
    prototyping: ['prototyp'],
    figma: ['figma'],
    'adobe-cc': ['adobe', 'creative cloud', 'photoshop', 'illustrator'],
    cad: ['cad', '3d modelling', '3d modeling'],
    blender: ['blender'],
    'html-css': ['html', 'css'],
    javascript: ['javascript', ' js '],
    react: ['react', 'frontend framework'],
    'team-leadership': ['team leadership', 'lead a team', 'mentor'],
    'stakeholder-mgmt': ['stakeholder'],
  };
  return skills.map((s) => ({
    slug: s.slug,
    cues: [s.label.toLowerCase(), ...(synonyms[s.slug] ?? [])],
  }));
}

const MATCHERS = buildMatchers(CANONICAL_SKILLS);

const PHASE_HEADINGS: ReadonlyArray<{ key: string; cues: readonly string[] }> = [
  { key: 'discovery', cues: ['discovery'] },
  { key: 'definition', cues: ['definition', 'define'] },
  { key: 'design', cues: ['design'] },
  { key: 'delivery', cues: ['delivery', 'deliver'] },
  { key: 'ops', cues: ['ops', 'operations'] },
];

/** Lines under a "Responsibilities" header, grouped by the phase sub-headings. */
function parseResponsibilities(text: string): Record<string, string> {
  const lines = text.split('\n');
  const out: Record<string, string[]> = {};
  let inResp = false;
  let phase: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const lower = line.toLowerCase();

    if (/^responsibilit/i.test(lower)) {
      inResp = true;
      phase = null;
      continue;
    }
    // A new top-level section ends the responsibilities block.
    if (inResp && line.length > 0 && !line.startsWith('-') && isSectionHeading(lower)) {
      const matchedPhase = PHASE_HEADINGS.find((p) => p.cues.some((c) => lower === c || lower.startsWith(c)));
      if (matchedPhase) {
        phase = matchedPhase.key;
        continue;
      }
      // Heading that isn't a phase → responsibilities block is over.
      if (!/^responsibilit/i.test(lower)) {
        inResp = false;
        phase = null;
        continue;
      }
    }
    if (inResp && phase && line.startsWith('-')) {
      const bullet = line.replace(/^[-•]\s*/, '').trim();
      if (bullet.length > 0) (out[phase] ??= []).push(bullet);
    }
  }

  const joined: Record<string, string> = {};
  for (const [key, arr] of Object.entries(out)) {
    if (arr.length > 0) joined[key] = arr.join('\n');
  }
  return joined;
}

/** Heuristic: a short, non-bullet, title-ish line is treated as a heading. */
function isSectionHeading(lower: string): boolean {
  return lower.length > 0 && lower.length < 40 && !lower.endsWith('.');
}

/** Bullet lines under a named header (e.g. "Deliverables", "Interview"). */
function bulletsUnder(text: string, headerRe: RegExp): string[] {
  const lines = text.split('\n');
  const out: string[] = [];
  let active = false;
  for (const raw of lines) {
    const line = raw.trim();
    const lower = line.toLowerCase();
    if (headerRe.test(lower)) {
      active = true;
      continue;
    }
    if (active && line.length > 0 && !line.startsWith('-') && isSectionHeading(lower)) {
      // Next heading ends the block.
      active = false;
      continue;
    }
    if (active && line.startsWith('-')) {
      const bullet = line.replace(/^[-•]\s*/, '').trim();
      if (bullet.length > 0) out.push(bullet);
    }
  }
  return out;
}

function parseRoleType(lower: string): ParsedRoleType | undefined {
  if (/during[- ]course|part[- ]time intern/.test(lower)) return 'during-course-internship';
  if (/vacation intern|summer intern|winter intern/.test(lower)) return 'vacation-internship';
  if (/\bintern(ship)?\b/.test(lower)) return 'vacation-internship';
  if (/full[- ]time/.test(lower)) return 'full-time';
  return undefined;
}

function parseWorkMode(lower: string): ParsedWorkMode | undefined {
  if (/hybrid/.test(lower)) return 'hybrid';
  if (/remote|work from home|wfh/.test(lower)) return 'remote';
  if (/on[- ]site|onsite|in[- ]office/.test(lower)) return 'onsite';
  return undefined;
}

/** "₹9,00,000 – ₹14,00,000" → { min, max } in rupees. */
function parseCompensation(text: string): { min?: number; max?: number; stipend?: number } {
  const compLine =
    text
      .split('\n')
      .find((l) => /compensation|salary|ctc|stipend|₹|inr|rs\.?/i.test(l)) ?? '';
  const nums = [...compLine.matchAll(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(l|lpa|lakh|k)?/gi)]
    .map((m) => {
      const raw = Number((m[1] ?? '').replace(/,/g, ''));
      if (!Number.isFinite(raw)) return NaN;
      const unit = (m[2] ?? '').toLowerCase();
      if (unit === 'l' || unit === 'lpa' || unit === 'lakh') return raw * 100000;
      if (unit === 'k') return raw * 1000;
      return raw;
    })
    .filter((n) => Number.isFinite(n) && n >= 1000);

  const isStipend = /stipend|per month|\/month|monthly/i.test(compLine);
  if (isStipend) {
    return nums.length > 0 ? { stipend: Math.round(nums[0]!) } : {};
  }
  if (nums.length >= 2) {
    const sorted = [...nums].sort((a, b) => a - b);
    return { min: Math.round(sorted[0]!), max: Math.round(sorted[sorted.length - 1]!) };
  }
  if (nums.length === 1) return { min: Math.round(nums[0]!) };
  return {};
}

function parseProgrammes(lower: string): { bachelors: boolean; masters: boolean } | undefined {
  const masters = /m\.?\s?des|masters|post[- ]graduate|pg\b/.test(lower);
  const bachelors = /b\.?\s?des|bachelor|under[- ]graduate|ug\b/.test(lower);
  if (!masters && !bachelors) return undefined;
  return { bachelors, masters };
}

function parseSkills(lower: string): Record<string, ParsedSkillState> {
  const out: Record<string, ParsedSkillState> = {};
  // "bonus" / "a plus" / "familiarity" phrasing downgrades a skill to preferred.
  for (const m of MATCHERS) {
    const hit = m.cues.find((c) => lower.includes(c));
    if (!hit) continue;
    const idx = lower.indexOf(hit);
    const window = lower.slice(Math.max(0, idx - 40), idx + hit.length + 40);
    const preferred = /(bonus|a plus|plus\b|nice to have|familiar|optional|not required)/.test(window);
    out[m.slug] = preferred ? 'preferred' : 'required';
  }
  return out;
}

function firstNonEmptyLine(text: string): string | undefined {
  const line = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
  if (!line) return undefined;
  // Strip a trailing " — Company" from a headline title.
  return line.split(/\s[—–-]\s/)[0]?.trim() ?? line;
}

function parseLocation(text: string): string | undefined {
  const cities = ['ahmedabad', 'gandhinagar', 'bengaluru', 'bangalore', 'mumbai', 'delhi', 'pune', 'hyderabad', 'chennai', 'kolkata'];
  const lower = text.toLowerCase();
  const found = cities.find((c) => lower.includes(c));
  if (!found) return undefined;
  return found.charAt(0).toUpperCase() + found.slice(1);
}

/**
 * The deterministic mapper — pure, synchronous, no network. Maps free JD text
 * onto the structured prefill. Exported so the wizard can run it directly when
 * the optional ML extract isn't used.
 */
export function mapTextToJd(text: string): ParsedJd {
  const lower = text.toLowerCase();
  const roleType = parseRoleType(lower);
  const comp = parseCompensation(text);
  const skills = parseSkills(lower);
  const responsibilities = parseResponsibilities(text);
  const deliverables = bulletsUnder(text, /^deliverabl|success criteria/i);
  const rounds = bulletsUnder(text, /^interview|hiring process|selection/i);
  const programmes = parseProgrammes(lower);
  const title = firstNonEmptyLine(text);
  const workMode = parseWorkMode(lower);
  const location = parseLocation(text);

  const internship = roleType ? isInternshipRoleType(roleType) : false;

  return {
    source: 'sample',
    ...(title ? { title } : {}),
    ...(roleType ? { roleType } : {}),
    ...(location ? { location } : {}),
    ...(workMode ? { workMode } : {}),
    ...(internship
      ? comp.stipend !== undefined
        ? { stipendRupees: comp.stipend }
        : comp.min !== undefined
          ? { stipendRupees: comp.min }
          : {}
      : {
          ...(comp.min !== undefined ? { baseMinRupees: comp.min } : {}),
          ...(comp.max !== undefined ? { baseMaxRupees: comp.max } : {}),
        }),
    ...(programmes ? { programmes } : {}),
    ...(Object.keys(skills).length > 0 ? { skills } : {}),
    ...(Object.keys(responsibilities).length > 0 ? { responsibilities } : {}),
    ...(deliverables.length > 0 ? { deliverables: deliverables.join('\n') } : {}),
    ...(rounds.length > 0 ? { interviewRounds: rounds } : {}),
  };
}

// ── optional ML extract (best-effort) ───────────────────────────────────────

/**
 * The wizard's *Upload your JD* entry point. Tries the ML worker first (if a
 * URL is configured and the endpoint answers), then falls back to the
 * deterministic mapper over {@link SAMPLE_JD_TEXT}. Never throws — any failure
 * returns the deterministic prefill so the demo always produces a result.
 *
 * `text` defaults to the bundled sample so the demo upload control can call
 * this with no argument.
 */
export async function parseUploadedJd(text: string = SAMPLE_JD_TEXT): Promise<ParsedJd> {
  const fromAnalyzer = await tryAnalyzerExtract(text);
  return fromAnalyzer ?? mapTextToJd(text);
}

/**
 * Best-effort call to the worker's (not-yet-built) `/ml/jd/extract`. Returns
 * `null` on any non-200, timeout, network error, or schema mismatch so the
 * caller falls back to the deterministic mapper. The base URL comes from the
 * public env var so it is readable in the client bundle; when unset we skip the
 * fetch entirely (the common demo case).
 */
async function tryAnalyzerExtract(text: string): Promise<ParsedJd | null> {
  const base = process.env['NEXT_PUBLIC_ML_WORKER_URL'];
  if (!base) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/ml/jd/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return normalizeAnalyzerResponse(json);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validate the worker's response defensively (the contract is unfrozen — this
 * endpoint is a later slice). We accept a permissive superset and keep only the
 * fields we understand, so a shape drift downgrades gracefully to whatever did
 * validate rather than throwing. Anything unrecognised → `null` so we fall back.
 */
function normalizeAnalyzerResponse(json: unknown): ParsedJd | null {
  if (typeof json !== 'object' || json === null) return null;
  const o = json as Record<string, unknown>;

  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;

  const roleTypeRaw = str(o['roleType']);
  const roleType: ParsedRoleType | undefined =
    roleTypeRaw === 'full-time' ||
    roleTypeRaw === 'vacation-internship' ||
    roleTypeRaw === 'during-course-internship'
      ? roleTypeRaw
      : undefined;

  const workModeRaw = str(o['workMode']);
  const workMode: ParsedWorkMode | undefined =
    workModeRaw === 'onsite' || workModeRaw === 'remote' || workModeRaw === 'hybrid'
      ? workModeRaw
      : undefined;

  const skillsOut: Record<string, ParsedSkillState> = {};
  const skillsRaw = o['skills'];
  if (Array.isArray(skillsRaw)) {
    for (const entry of skillsRaw) {
      if (typeof entry !== 'object' || entry === null) continue;
      const e = entry as Record<string, unknown>;
      const slug = str(e['slug']);
      if (!slug) continue;
      skillsOut[slug] = e['required'] === true ? 'required' : 'preferred';
    }
  }

  const result: ParsedJd = {
    source: 'analyzer',
    ...(str(o['title']) ? { title: str(o['title'])! } : {}),
    ...(roleType ? { roleType } : {}),
    ...(str(o['location']) ? { location: str(o['location'])! } : {}),
    ...(workMode ? { workMode } : {}),
    ...(num(o['baseMinRupees']) !== undefined ? { baseMinRupees: num(o['baseMinRupees'])! } : {}),
    ...(num(o['baseMaxRupees']) !== undefined ? { baseMaxRupees: num(o['baseMaxRupees'])! } : {}),
    ...(num(o['stipendRupees']) !== undefined ? { stipendRupees: num(o['stipendRupees'])! } : {}),
    ...(Object.keys(skillsOut).length > 0 ? { skills: skillsOut } : {}),
    ...(str(o['supplementaryProse']) ? { supplementaryProse: str(o['supplementaryProse'])! } : {}),
  };

  // If literally nothing useful validated, treat it as a miss.
  const hasContent = Object.keys(result).length > 1; // more than just `source`
  return hasContent ? result : null;
}
