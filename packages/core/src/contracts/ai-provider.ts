/**
 * AIProvider — ML/LLM adapter contract.
 *
 * STRICTLY SANDBOXED operations (per CLAUDE.md non-negotiable rules + Phase 6.11a):
 *   summarize | translate | explain | draft  — allowed
 *   rank      | score     | filter           — FORBIDDEN at the API surface
 *
 * AI is a translator and summarizer, never a judge. Recruiter UI never sees
 * AI-ranked candidate lists. The Python ML/LLM workers expose this contract
 * over HTTP (FastAPI + Pydantic) and all calls are instrumented through
 * Langfuse with a trace ID.
 *
 * Implementations:
 * - ML calls: Python FastAPI workers (LayoutLM for JD extraction, BERT-class
 *   for skill/discipline matching, rule-based + classifier for scope-creep).
 * - LLM calls: self-hosted local LLM (vLLM) for natural-language tasks.
 * - Dev convenience: Vercel AI Gateway adapter (prototype only).
 */

import type { z } from 'zod';

export type AiOperation = 'summarize' | 'translate' | 'explain' | 'draft';

export interface AiCallContext {
  readonly traceId: string;
  readonly cycleId?: string;
  readonly actorId: string;
  readonly module: string;
}

// JD-domain operations
export interface JdExtractRequest {
  readonly pdfBytes: Uint8Array;
  readonly mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

export interface JdExtractResponse {
  readonly title?: string;
  readonly roleType?: 'full-time' | 'vacation-internship' | 'during-course-internship';
  readonly location?: string;
  readonly workMode?: 'onsite' | 'remote' | 'hybrid';
  readonly positions?: number;
  readonly skills?: ReadonlyArray<{ name: string; required: boolean }>;
  readonly responsibilities?: Readonly<Record<string, readonly string[]>>;
  readonly compensation?: {
    readonly baseMinPaise?: number;
    readonly baseMaxPaise?: number;
    readonly stipendPaise?: number;
    readonly currency?: 'INR';
  };
  readonly confidence: number; // 0..1, model-self-reported
}

export interface JdScopeClassifyResponse {
  readonly scopeCreepDetected: boolean;
  readonly demandedDisciplines: ReadonlyArray<{ slug: string; weight: number }>;
  readonly suggestedStipendFloorPaise: number;
  readonly rationale: string;
}

export interface DisciplineMappingResponse {
  readonly suggestions: ReadonlyArray<{
    readonly disciplineSlug: string;
    readonly disciplineName: string;
    readonly description: string;
    readonly confidence: number;
    readonly tier: 'primary' | 'adjacent' | 'peripheral';
  }>;
}

export interface SummarizeRequest {
  readonly text: string;
  readonly maxWords?: number;
  readonly tone?: 'institutional' | 'neutral';
}

export interface DraftRequest {
  readonly purpose: 'rejection-collective' | 'admin-reply' | 'cycle-summary';
  readonly context: Readonly<Record<string, string>>;
  readonly maxWords?: number;
}

export interface AiProvider {
  // Allowed operations only
  extractJd(req: JdExtractRequest, ctx: AiCallContext): Promise<JdExtractResponse>;
  classifyScope(jdBody: string, ctx: AiCallContext): Promise<JdScopeClassifyResponse>;
  mapDisciplines(title: string, body: string, ctx: AiCallContext): Promise<DisciplineMappingResponse>;
  summarize(req: SummarizeRequest, ctx: AiCallContext): Promise<{ summary: string }>;
  draft(req: DraftRequest, ctx: AiCallContext): Promise<{ draft: string }>;
  translate(text: string, targetLang: 'en' | 'hi', ctx: AiCallContext): Promise<{ translated: string }>;
  explain(question: string, scope: 'discipline-catalog' | 'cycle-stats', ctx: AiCallContext): Promise<{ answer: string }>;
}

/**
 * Zod schema declaration is the responsibility of the adapter implementation
 * (where Zod is imported and used to validate the Python worker's JSON response).
 * The `z` import here is type-only — kept for documentation / future use.
 */
type _ZodHandle = z.ZodTypeAny; // eslint-disable-line @typescript-eslint/no-unused-vars
