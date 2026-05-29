import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ContentBlock, CycleConfig } from './types';

/**
 * JSON-backed admin-CMS store. Seeds the current cycle config + the content
 * blocks that replace today's static HTML / scanned PDFs. Admin edits persist
 * here; swap for the DB `cycle_config` + `content_blocks` tables later.
 */

interface StoreState {
  readonly cycles: Readonly<Record<string, CycleConfig>>;
  readonly content: Readonly<Record<string, ContentBlock>>;
}

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'admin-cms.json');
}

function seedInitialState(): StoreState {
  const cycles: Record<string, CycleConfig> = {
    cycle_spring_2026: {
      cycleId: 'cycle_spring_2026',
      label: 'Spring 2026',
      status: 'open',
      feeRupees: 15000,
      applyOpens: '14 Apr 2026',
      jdDeadline: '14 May 2026',
      browseOpens: '23 May 2026',
      interviewWindow: '1–5 Jun 2026',
      offerBy: '10 Jun 2026',
    },
  };

  const blocks: ContentBlock[] = [
    { slot: 'guidelines', title: 'Sponsorship guidelines', body: 'Eligibility, fees + GST, the structured-JD expectation, conduct, IPR, and redressal. Replaces the scanned image-PDF with searchable HTML.' },
    { slot: 'faq', title: 'FAQ', body: 'Participation fee is non-refundable. NID does not guarantee placements. GP fee (₹5,000/intern) is invoiced to the recruiter, never deducted from the student stipend.' },
    { slot: 'process', title: '8-step process', body: 'Apply → pay fee → track token → admin verifies → credentials issued → post JD → browse + individually shortlist → interview + offer cascade.' },
    { slot: 'footer', title: 'Footer copy', body: 'For any query please contact industry@nid.edu' },
    { slot: 'error-catalogue', title: 'Login error vocabulary', body: 'Account locked · cycle closed · wrong credentials. Replaces the ASP.NET lblError server string.' },
    { slot: 'legal', title: 'Privacy · terms · grievance', body: 'DPDP Act 2023 consent, data-deletion rights, grievance officer contact, retention policy.' },
  ];
  const content: Record<string, ContentBlock> = {};
  for (const b of blocks) content[b.slot] = b;

  return { cycles, content };
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return seedInitialState();
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    const seed = seedInitialState();
    return {
      cycles: p.cycles ?? seed.cycles,
      content: p.content ?? seed.content,
    };
  } catch {
    return seedInitialState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function getCycleConfig(cycleId: string): CycleConfig | null {
  return loadState().cycles[cycleId] ?? null;
}

export function putCycleConfig(config: CycleConfig): void {
  const s = loadState();
  persist({ ...s, cycles: { ...s.cycles, [config.cycleId]: { ...config, updatedAt: new Date().toISOString() } } });
}

export function allContentBlocks(): readonly ContentBlock[] {
  return Object.values(loadState().content).sort((a, b) => a.slot.localeCompare(b.slot));
}

export function getContentBlock(slot: string): ContentBlock | null {
  return loadState().content[slot] ?? null;
}

export function putContentBlock(block: ContentBlock): void {
  const s = loadState();
  persist({ ...s, content: { ...s.content, [block.slot]: { ...block, updatedAt: new Date().toISOString() } } });
}
