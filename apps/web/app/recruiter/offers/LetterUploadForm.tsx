'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Button, FileUpload } from '@nid/ui';

/**
 * LetterUploadForm — per-accepted-candidate offer-letter upload (Round 4 §D).
 *
 * Client/server boundary: persists ONLY by rendering a `<form>` whose `action`
 * is the injected `pushOfferLetterAction` server action (it lives in the page's
 * `letter-actions.ts`); this island imports no store or server lib. The `@nid/ui`
 * FileUpload atom reads the chosen PDF with FileReader and writes its raw base64
 * into a hidden `pdfBase64` input (+ `pdfBase64FileName`); we add a `sizeBytes`
 * hidden input (set from the accepted File via `onFile`) so the action can
 * report the decoded size to `uploadLetterSchema` (which the module re-checks).
 *
 * `jdId`, `studentId`, and `wave` ride along as hidden inputs so the action
 * knows which (jdId, studentId, wave) the letter binds — the certificate hash
 * folds them in.
 */

export interface LetterUploadFormProps {
  readonly jdId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly wave: number;
  /** True once a letter already exists for this candidate (changes the CTA copy). */
  readonly hasLetter: boolean;
  readonly pushOfferLetterAction: (formData: FormData) => void | Promise<void>;
}

export function LetterUploadForm({
  jdId,
  studentId,
  studentName,
  wave,
  hasLetter,
  pushOfferLetterAction,
}: LetterUploadFormProps) {
  const sizeRef = useRef<HTMLInputElement | null>(null);
  const [ready, setReady] = useState(false);

  const onFile = (file: File): void => {
    if (sizeRef.current) sizeRef.current.value = String(file.size);
    setReady(true);
  };

  return (
    <form action={pushOfferLetterAction} style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <input type="hidden" name="jdId" value={jdId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="wave" value={wave} />
      <input ref={sizeRef} type="hidden" name="sizeBytes" defaultValue="" />

      <FileUpload
        name="pdfBase64"
        accept="application/pdf"
        label={`Upload ${studentName}'s offer letter (PDF)`}
        hint="PDF up to 2.8 MB — an institute certificate of authenticity is attached automatically."
        onFile={onFile}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button type="submit" size="sm" disabled={!ready}>
          {hasLetter ? 'Replace letter' : 'Send offer letter'}
        </Button>
        <span style={hint}>
          {hasLetter ? 'Re-uploading mints a fresh certificate and retires the old hash.' : 'Sending notifies the student and stamps the certificate.'}
        </span>
      </div>
    </form>
  );
}

const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
