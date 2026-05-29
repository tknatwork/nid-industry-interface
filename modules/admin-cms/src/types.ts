import { z } from 'zod';

/**
 * Admin-CMS types (Phase 3.4). The current portal hand-edits cycle dates into
 * HTML and serves static/scanned PDFs; this module makes both admin-editable.
 */

export interface CycleConfig {
  readonly cycleId: string;
  readonly label: string;
  readonly status: 'open' | 'upcoming' | 'closed';
  readonly feeRupees: number;
  readonly applyOpens: string;
  readonly jdDeadline: string;
  readonly browseOpens: string;
  readonly interviewWindow: string;
  readonly offerBy: string;
  readonly updatedAt?: string;
}

export interface ContentBlock {
  readonly slot: string;
  readonly title: string;
  readonly body: string;
  readonly updatedAt?: string;
}

export const cycleConfigUpdateSchema = z.object({
  cycleId: z.string().min(1),
  label: z.string().trim().min(1, 'Label is required'),
  status: z.enum(['open', 'upcoming', 'closed']),
  feeRupees: z.coerce.number().int().min(0).max(10_000_000),
  applyOpens: z.string().trim().min(1),
  jdDeadline: z.string().trim().min(1),
  browseOpens: z.string().trim().min(1),
  interviewWindow: z.string().trim().min(1),
  offerBy: z.string().trim().min(1),
});

export const contentBlockUpdateSchema = z.object({
  slot: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  body: z.string().trim().min(1, 'Body is required'),
});

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}
