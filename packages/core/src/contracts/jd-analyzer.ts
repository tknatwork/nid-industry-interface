/**
 * JdScopeAnalyzer — the ML (not LLM) port for scope-creep analysis (Phase 6.11a:
 * "default to ML where the task is structured and deterministic").
 *
 * Distinct from AiProvider.classifyScope, which is prose-oriented and LLM-flavored.
 * This port takes the *structured* JD fields (skills with their taxonomy group +
 * which responsibility categories are populated) and returns a graduated stipend
 * multiplier + the flags a human moderator needs. The implementation is a Python
 * worker over HTTP; the adapter validates its JSON with Zod at the boundary and
 * falls back to a deterministic heuristic when the worker is unreachable.
 *
 * Types only (this barrel is `export type *`). The Zod schema lives in the adapter.
 */

export type AnalyzerRoleType = 'full-time' | 'vacation-internship' | 'during-course-internship';

export interface ScopeAnalysisSkill {
  readonly slug: string;
  /** Canonical taxonomy group, e.g. 'engineering' | 'craft' | 'research'. */
  readonly group: string;
  readonly required: boolean;
}

export interface ScopeAnalysisInput {
  readonly roleType: AnalyzerRoleType;
  readonly skills: readonly ScopeAnalysisSkill[];
  /** Responsibility categories that have at least one bullet (discovery/.../ops). */
  readonly responsibilityCategories: readonly string[];
}

export interface ScopeAnalysisResult {
  /** Stipend-floor multiplier, ≥ 1. 1 = no scope creep. */
  readonly scopeMultiplier: number;
  readonly scopeCreepDetected: boolean;
  /** Slugs of the skills that tripped the scope-creep signal (e.g. dev skills). */
  readonly flaggedSkillSlugs: readonly string[];
  /** Taxonomy groups present in the JD, for the moderator's context. */
  readonly detectedGroups: readonly string[];
  readonly rationale: string;
  /** 'analyzer' = the worker answered; 'fallback' = deterministic local heuristic. */
  readonly source: 'analyzer' | 'fallback';
}

export interface JdScopeAnalyzer {
  analyzeScope(input: ScopeAnalysisInput): Promise<ScopeAnalysisResult>;
}
