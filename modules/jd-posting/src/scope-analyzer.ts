import { z } from 'zod';
import type {
  JdScopeAnalyzer,
  ScopeAnalysisInput,
  ScopeAnalysisResult,
} from '@nid/core';
import { CANONICAL_SKILLS } from './skills';
import type { JdRecord } from './types';

/**
 * HTTP adapter for the @nid/core JdScopeAnalyzer port (Phase 6.11a). Calls the
 * Python ML worker, validates its JSON with Zod at the boundary (Phase 6.12a),
 * and falls back to a deterministic local heuristic if the worker is slow or
 * down — so JD moderation degrades gracefully and never hard-depends on the
 * worker being up (Phase 6.12b).
 */

const ML_WORKER_URL = process.env['ML_WORKER_URL'] ?? 'http://127.0.0.1:8000';
const TIMEOUT_MS = 1500;

const scopeResponseSchema = z.object({
  scopeMultiplier: z.number().min(1),
  scopeCreepDetected: z.boolean(),
  flaggedSkillSlugs: z.array(z.string()),
  detectedGroups: z.array(z.string()),
  rationale: z.string(),
});

const GROUP_BY_SLUG = new Map(CANONICAL_SKILLS.map((s) => [s.slug, s.group]));

/** Deterministic fallback — mirrors the legacy 1.0/1.4 engineering heuristic. */
function fallback(input: ScopeAnalysisInput): ScopeAnalysisResult {
  const eng = input.skills.filter((s) => s.group === 'engineering');
  const hasDesign = input.skills.some((s) => s.group !== 'engineering');
  const creep = eng.length > 0 && hasDesign;
  return {
    scopeMultiplier: creep ? 1.4 : 1,
    scopeCreepDetected: creep,
    flaggedSkillSlugs: creep ? eng.map((s) => s.slug) : [],
    detectedGroups: [...new Set(input.skills.map((s) => s.group))].sort(),
    rationale: creep
      ? 'Deterministic fallback (analyzer unavailable): engineering skills bundled with design — floor ×1.4.'
      : 'Deterministic fallback (analyzer unavailable): no scope creep detected.',
    source: 'fallback',
  };
}

export const httpScopeAnalyzer: JdScopeAnalyzer = {
  async analyzeScope(input: ScopeAnalysisInput): Promise<ScopeAnalysisResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${ML_WORKER_URL}/ml/jd/scope-classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      if (!res.ok) return fallback(input);
      const parsed = scopeResponseSchema.safeParse(await res.json());
      if (!parsed.success) return fallback(input);
      return { ...parsed.data, source: 'analyzer' };
    } catch {
      return fallback(input);
    } finally {
      clearTimeout(timer);
    }
  },
};

/** Build the analyzer input from a JD record (looks up each skill's taxonomy group). */
export function scopeInputForJd(jd: JdRecord): ScopeAnalysisInput {
  return {
    roleType: jd.roleType,
    skills: jd.skills.map((s) => ({
      slug: s.slug,
      group: GROUP_BY_SLUG.get(s.slug) ?? 'tools',
      required: s.required,
    })),
    responsibilityCategories: Object.entries(jd.responsibilities)
      .filter(([, bullets]) => bullets.length > 0)
      .map(([category]) => category),
  };
}

export function analyzeScopeForJd(jd: JdRecord): Promise<ScopeAnalysisResult> {
  return httpScopeAnalyzer.analyzeScope(scopeInputForJd(jd));
}
