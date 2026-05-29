import type { CandidateSort, CandidateView, ShortlistEntry, ShortlistResult } from './types';
import {
  addShortlist,
  allStudents,
  isShortlisted as storeIsShortlisted,
  removeShortlist,
  shortlistForJd,
  studentById,
} from './store';

export interface EligibilityQuery {
  readonly cycleId: string;
  readonly targetDisciplineIds: readonly string[];
  readonly sort?: CandidateSort;
}

/**
 * Eligible candidates for a JD: discipline ∈ targetDisciplineIds AND opted into
 * the cycle. Sort is restricted to name | discipline | batch by the type — there
 * is no cgpa / fit-score / demographic option (Phase 4.4 guardrail).
 */
export function listEligibleCandidates(query: EligibilityQuery): readonly CandidateView[] {
  const targets = new Set(query.targetDisciplineIds);
  const eligible = allStudents().filter(
    (s) => targets.has(s.disciplineId) && s.optedInCycles.includes(query.cycleId),
  );

  const sort = query.sort ?? 'name';
  const sorted = eligible.slice().sort((a, b) => {
    switch (sort) {
      case 'discipline':
        return a.disciplineName.localeCompare(b.disciplineName) || a.name.localeCompare(b.name);
      case 'batch':
        return a.batchYear - b.batchYear || a.name.localeCompare(b.name);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return sorted.map(toView);
}

export function getCandidate(studentId: string): CandidateView | null {
  const s = studentById(studentId);
  return s ? toView(s) : null;
}

/**
 * Individual shortlist — one student, note required. No bulk variant exists.
 */
export function shortlistCandidate(input: {
  jdId: string;
  studentId: string;
  note: string;
}): ShortlistResult {
  if (!input.note.trim()) {
    return { ok: false, reason: 'A note is required to shortlist a candidate.' };
  }
  if (!studentById(input.studentId)) {
    return { ok: false, reason: 'Candidate not found.' };
  }
  const entry: ShortlistEntry = {
    jdId: input.jdId,
    studentId: input.studentId,
    note: input.note.trim(),
    shortlistedAt: new Date().toISOString(),
  };
  addShortlist(entry);
  return { ok: true };
}

export function unshortlistCandidate(jdId: string, studentId: string): ShortlistResult {
  removeShortlist(jdId, studentId);
  return { ok: true };
}

export function listShortlist(jdId: string): ReadonlyArray<{ candidate: CandidateView; note: string; shortlistedAt: string }> {
  return shortlistForJd(jdId)
    .map((e) => {
      const s = studentById(e.studentId);
      return s ? { candidate: toView(s), note: e.note, shortlistedAt: e.shortlistedAt } : null;
    })
    .filter((x): x is { candidate: CandidateView; note: string; shortlistedAt: string } => x !== null);
}

export function isShortlisted(jdId: string, studentId: string): boolean {
  return storeIsShortlisted(jdId, studentId);
}

function toView(s: CandidateView): CandidateView {
  // The seed already matches CandidateView; strip the seed-only optedInCycles field.
  return {
    studentId: s.studentId,
    name: s.name,
    disciplineId: s.disciplineId,
    disciplineName: s.disciplineName,
    accent: s.accent,
    programme: s.programme,
    batchYear: s.batchYear,
    semester: s.semester,
    portfolioUrl: s.portfolioUrl,
    portfolioHost: s.portfolioHost,
    cvAvailable: s.cvAvailable,
    ...(s.cvUrl ? { cvUrl: s.cvUrl } : {}),
    ...(s.presentationUrl ? { presentationUrl: s.presentationUrl } : {}),
    ...(s.statementOfIntent ? { statementOfIntent: s.statementOfIntent } : {}),
  };
}
