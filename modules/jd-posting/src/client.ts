// @nid/module-jd-posting/client — the client-safe subset of the module's public API.
//
// The default entry ('.') re-exports the JSON-file-backed store (actions.ts /
// store.ts), which pulls `node:fs` / `node:path`. Those cannot be bundled into a
// browser/client bundle, so a `'use client'` component importing from '.' breaks
// `next build`. This entry re-exports ONLY the pure pieces — the canonical skill
// taxonomy, the stipend-floor formula, the role-type → expected-work reference,
// the discipline taxonomy, and the domain types — none of which import the store.
//
// Client components (e.g. the JD wizard's live salary predictor + the upload
// parser) import from '@nid/module-jd-posting/client'; server components and
// actions keep importing from '@nid/module-jd-posting'. Both share one source of
// truth (these same files), so the floor the client previews matches the gate the
// server enforces.

export {
  CANONICAL_SKILLS,
  SKILL_GROUPS,
  skillLabel,
  isCanonicalSkill,
  type CanonicalSkill,
  type SkillGroup,
} from './skills';

export { floorPaiseFor, strictestFloorPaise, type Programme } from './stipend-floors';

export {
  ROLE_WORK_REF,
  expectedWorkFor,
  isInternshipRoleType,
  type ExpectedWorkRef,
  type InternshipRoleType,
} from './role-work-ref';

export { DISCIPLINES_REF, disciplineName, type DisciplineRef } from './disciplines-ref';

export {
  type JdRecord,
  type JdDraftInput,
  type ProgrammeComp,
  type EvaluationTask,
  type GateFailure,
  type GateReport,
} from './types';
