'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@nid/ui';

/**
 * StudentLetterViewer — lets a student open their accepted offer's PDF in a new
 * tab (Round 4 §D). The base64 PDF is passed in as a plain prop by the student
 * offers Server Component (which read it from `getOfferLetter`); this island
 * reconstructs a Blob and an object URL on the client and opens it.
 *
 * Client/server boundary: it imports no store or server lib — only the base64
 * string prop. The blob URL is created lazily on first view and revoked on
 * unmount so we don't leak object URLs.
 *
 * Why a blob rather than a `data:` href: large base64 in an anchor href is
 * brittle across browsers; a Blob URL opens reliably and lets us revoke it.
 */

export interface StudentLetterViewerProps {
  /** Raw base64 PDF (no data-URL prefix). */
  readonly pdfBase64: string;
  readonly fileName: string;
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function StudentLetterViewer({ pdfBase64, fileName }: StudentLetterViewerProps) {
  const urlRef = useRef<string | null>(null);
  const [error, setError] = useState(false);

  // Build the blob URL once (memo guards against rebuilding on every render);
  // the cleanup effect revokes it on unmount.
  const url = useMemo(() => {
    try {
      const blob = base64ToBlob(pdfBase64.replace(/\s+/g, ''), 'application/pdf');
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      return objectUrl;
    } catch {
      setError(true);
      return null;
    }
  }, [pdfBase64]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  if (error || url === null) {
    return <span style={hint}>Letter unavailable.</span>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} aria-label={`View offer letter ${fileName}`}>
      <Button type="button" size="sm" variant="ghost">
        View letter (PDF)
      </Button>
    </a>
  );
}

const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
