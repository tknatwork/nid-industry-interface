'use client';

import { useRouter } from 'next/navigation';
import { type CSSProperties } from 'react';
import { Button, Field, Overlay, StatusPill } from '@nid/ui';

/**
 * Candidates workspace body (Round 4 §A — the linear-IA spine).
 *
 * Extracted from the old per-JD `applicants/page.tsx` (grid) +
 * `applicants/[studentId]/page.tsx` (detail + shortlist) so the Candidates
 * workspace can show both inline WITHOUT navigating into `/recruiter/jds/[jdId]/…`
 * (which flipped the top tab to "JDs"). A tile click pushes `?student=<id>` and
 * the matching candidate opens in an `Overlay` drawer; closing it (Esc / backdrop /
 * ✕) pushes back to `?jd=<id>` so the tab never changes and deep links survive.
 *
 * Client/server boundary (critical): this island value-imports NO store and NO
 * server-only lib. The Server Component page resolves ownership + the pipeline
 * stage, maps its `JdRecord` + candidate views down to the plain serializable
 * props below, and passes the shortlist server actions DOWN. Persistence happens
 * only by rendering a `<form action={shortlistAction}>` with hidden inputs —
 * exactly the InterviewerPicker pattern.
 *
 * Linearity: `shortlistDisabled` is computed server-side (true once the pipeline
 * stage is past `shortlisting`). When set, the shortlist form is replaced by a
 * read-only notice — the stage-gate the Wave 2 linearity verifier asserts.
 */

export interface CandidateTileView {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  readonly programme: 'bachelors' | 'masters';
  readonly batchYear: number;
  readonly semester: number;
  readonly portfolioUrl: string;
  readonly portfolioHost: string;
  readonly cvAvailable: boolean;
  readonly statementOfIntent?: string;
  /** Discipline theme key for the `data-discipline` placeholder tint. */
  readonly theme: string;
  /** The recruiter's required shortlist note, when this candidate is shortlisted. */
  readonly shortlistNote?: string;
}

export interface CandidatesWorkspaceBodyProps {
  readonly jdId: string;
  readonly jdTitle: string;
  readonly cycleLabel: string;
  /** Eligible candidates for this JD (already discipline-filtered + sorted server-side). */
  readonly candidates: readonly CandidateTileView[];
  /** The `?student=` selection that should open the detail drawer (if any). */
  readonly selectedStudentId?: string;
  /** True once the pipeline stage is past `shortlisting` — shortlist edits are frozen. */
  readonly shortlistDisabled: boolean;
  /** Workspace base path, e.g. `/recruiter/candidates`. */
  readonly basePath: string;
  /** Any shortlist error bubbled back via `?error=`. */
  readonly error?: string;
  readonly shortlistAction: (formData: FormData) => void | Promise<void>;
  readonly unshortlistAction: (formData: FormData) => void | Promise<void>;
}

export function CandidatesWorkspaceBody({
  jdId,
  jdTitle,
  cycleLabel,
  candidates,
  selectedStudentId,
  shortlistDisabled,
  basePath,
  error,
  shortlistAction,
  unshortlistAction,
}: CandidatesWorkspaceBodyProps) {
  const router = useRouter();
  const jdQuery = `?jd=${encodeURIComponent(jdId)}`;

  const open = (studentId: string) =>
    router.push(`${basePath}${jdQuery}&student=${encodeURIComponent(studentId)}`);
  const close = () => router.push(`${basePath}${jdQuery}`);

  const shortlistedCount = candidates.filter((c) => c.shortlistNote !== undefined).length;
  const selected =
    selectedStudentId !== undefined
      ? candidates.find((c) => c.studentId === selectedStudentId)
      : undefined;

  return (
    <>
      <header style={headerRow}>
        <div>
          <h2 style={h2}>
            {candidates.length} eligible {candidates.length === 1 ? 'candidate' : 'candidates'}
          </h2>
          <p style={subText}>
            Students in <strong>{jdTitle}</strong>&rsquo;s confirmed disciplines who opted into{' '}
            {cycleLabel} · {shortlistedCount} shortlisted
          </p>
        </div>
        {shortlistDisabled && (
          <StatusPill tone="info">Shortlisting closed — interviews underway</StatusPill>
        )}
      </header>

      {candidates.length === 0 ? (
        <p style={notice}>No eligible candidates yet for this JD&rsquo;s disciplines this cycle.</p>
      ) : (
        <div style={grid}>
          {candidates.map((c) => (
            <button
              key={c.studentId}
              type="button"
              onClick={() => open(c.studentId)}
              data-discipline={c.theme}
              style={tileButton}
            >
              <span style={tilePreview}>
                <span style={tilePreviewLabel}>Portfolio · {c.portfolioHost}</span>
                {c.shortlistNote !== undefined && (
                  <span style={tileBadge}>
                    <StatusPill tone="success">Shortlisted</StatusPill>
                  </span>
                )}
              </span>
              <span style={tileBody}>
                <span style={tileName}>{c.name}</span>
                <span style={tileMeta}>{c.disciplineName}</span>
                <span style={tileMetaSmall}>
                  {c.programme === 'masters' ? 'M.Des' : 'B.Des'} · batch {c.batchYear}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <Overlay
        open={selected !== undefined}
        onClose={close}
        title={selected?.name ?? 'Candidate'}
        width="720px"
      >
        {selected !== undefined && (
          <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <div>
              <p style={subText}>
                {selected.disciplineName} · {selected.programme === 'masters' ? 'M.Des' : 'B.Des'} ·
                semester {selected.semester} · batch {selected.batchYear}
                {selected.shortlistNote !== undefined && (
                  <span style={{ marginLeft: 'var(--space-2)' }}>
                    <StatusPill tone="success">Shortlisted</StatusPill>
                  </span>
                )}
              </p>
            </div>

            {/* Portfolio-first: discipline-tinted placeholder + external link-out (IPR note). */}
            <div data-discipline={selected.theme} style={portfolioCard}>
              <div style={portfolioPreview}>
                Portfolio preview (hosted on {selected.portfolioHost})
              </div>
              <div style={portfolioFoot}>
                <p style={iprNote}>
                  This portfolio is hosted externally at <strong>{selected.portfolioHost}</strong>.
                  The student retains IPR over their work. You are leaving NID&rsquo;s surface to
                  view it.
                </p>
                <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="sm">
                    View external portfolio ↗
                  </Button>
                </a>
                <span style={{ display: 'inline-block', marginLeft: 'var(--space-3)' }}>
                  {selected.cvAvailable ? (
                    <Button variant="ghost" size="sm">
                      Download CV (PDF)
                    </Button>
                  ) : (
                    <span style={cvAbsent}>CV not provided</span>
                  )}
                </span>
              </div>
            </div>

            {selected.statementOfIntent !== undefined && (
              <section style={sectionCard}>
                <h3 style={sectionLabel}>Statement of intent</h3>
                <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)', lineHeight: 1.6 }}>
                  {selected.statementOfIntent}
                </p>
              </section>
            )}

            <section style={sectionCard}>
              <h3 style={sectionLabel}>
                {selected.shortlistNote !== undefined ? 'Shortlisted' : 'Shortlist this candidate'}
              </h3>

              {shortlistDisabled ? (
                <p style={lockedNote}>
                  Shortlisting is closed for this JD — interviews are underway. The pipeline only
                  moves forward, so the shortlist for {jdTitle} is now read-only.
                  {selected.shortlistNote !== undefined && (
                    <span style={{ display: 'block', marginTop: 'var(--space-2)', color: 'var(--text-strong)' }}>
                      Your note: {selected.shortlistNote}
                    </span>
                  )}
                </p>
              ) : (
                <>
                  <p style={iprNote}>
                    A note is required — NID asks recruiters to evaluate each designer individually,
                    not in bulk.
                  </p>

                  {error !== undefined && (
                    <p role="alert" style={errorText}>
                      {error}
                    </p>
                  )}

                  <form action={shortlistAction} style={{ display: 'grid', gap: 'var(--space-3)' }}>
                    <input type="hidden" name="jdId" value={jdId} />
                    <input type="hidden" name="studentId" value={selected.studentId} />
                    <Field
                      id="note"
                      name="note"
                      label="Your note"
                      placeholder="Why this candidate? (required)"
                      required
                      defaultValue={selected.shortlistNote ?? ''}
                    />
                    <div>
                      <Button type="submit" size="sm">
                        {selected.shortlistNote !== undefined ? 'Update note' : 'Shortlist'}
                      </Button>
                    </div>
                  </form>

                  {selected.shortlistNote !== undefined && (
                    <form action={unshortlistAction} style={{ marginTop: 'var(--space-3)' }}>
                      <input type="hidden" name="jdId" value={jdId} />
                      <input type="hidden" name="studentId" value={selected.studentId} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove from shortlist
                      </Button>
                    </form>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </Overlay>
    </>
  );
}

const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-6)',
};
const h2: CSSProperties = {
  fontSize: 'var(--fs-28)',
  lineHeight: 'var(--lh-32)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
};
const subText: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  marginTop: 'var(--space-2)',
};
const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 'var(--space-4)',
};
const tileButton: CSSProperties = {
  display: 'block',
  textAlign: 'left',
  width: '100%',
  padding: 0,
  cursor: 'pointer',
  backgroundColor: 'var(--card-bg)',
  borderRadius: 'var(--card-radius)',
  overflow: 'hidden',
  boxShadow: 'var(--card-shadow)',
  border: '1px solid var(--card-border)',
};
const tilePreview: CSSProperties = {
  aspectRatio: '4 / 3',
  backgroundColor: 'var(--accent)',
  display: 'flex',
  alignItems: 'flex-end',
  padding: 'var(--space-3)',
  position: 'relative',
};
const tilePreviewLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-on-accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  opacity: 0.9,
};
const tileBadge: CSSProperties = {
  position: 'absolute',
  top: 'var(--space-2)',
  right: 'var(--space-2)',
};
const tileBody: CSSProperties = { display: 'block', padding: 'var(--space-4)' };
const tileName: CSSProperties = {
  display: 'block',
  fontSize: 'var(--fs-18)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
};
const tileMeta: CSSProperties = {
  display: 'block',
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  marginTop: 'var(--space-1)',
};
const tileMetaSmall: CSSProperties = {
  display: 'block',
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  marginTop: 'var(--space-1)',
};
const notice: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-8)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--card-radius)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center',
};
const portfolioCard: CSSProperties = {
  borderRadius: 'var(--card-radius)',
  overflow: 'hidden',
  border: '1px solid var(--card-border)',
};
const portfolioPreview: CSSProperties = {
  aspectRatio: '16 / 9',
  backgroundColor: 'var(--accent)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-on-accent)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const portfolioFoot: CSSProperties = {
  padding: 'var(--space-4)',
  backgroundColor: 'var(--surface-card)',
};
const iprNote: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-3)',
  lineHeight: 1.5,
};
const cvAbsent: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const sectionCard: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const sectionLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};
const lockedNote: CSSProperties = {
  fontSize: 'var(--fs-13)',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};
const errorText: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--input-error-text)',
  fontWeight: 'var(--fw-600)',
  marginBottom: 'var(--space-3)',
};
