import {
  contentBlockUpdateSchema,
  cycleConfigUpdateSchema,
  type ActionResult,
  type ContentBlock,
  type CycleConfig,
} from './types';
import {
  allContentBlocks as storeAllContentBlocks,
  getContentBlock as storeGetContentBlock,
  getCycleConfig as storeGetCycleConfig,
  putContentBlock,
  putCycleConfig,
} from './store';

export function getCycleConfig(cycleId: string): CycleConfig | null {
  return storeGetCycleConfig(cycleId);
}

export function updateCycleConfig(input: unknown): ActionResult {
  const parsed = cycleConfigUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  putCycleConfig(parsed.data);
  return { ok: true };
}

export function listContentBlocks(): readonly ContentBlock[] {
  return storeAllContentBlocks();
}

export function getContentBlock(slot: string): ContentBlock | null {
  return storeGetContentBlock(slot);
}

export function updateContentBlock(input: unknown): ActionResult {
  const parsed = contentBlockUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const existing = storeGetContentBlock(parsed.data.slot);
  if (!existing) return { ok: false, reason: 'Unknown content slot.' };
  putContentBlock({ slot: parsed.data.slot, title: parsed.data.title, body: parsed.data.body });
  return { ok: true };
}
