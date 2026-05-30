'use client';

import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

/**
 * FileUpload — a drag-and-drop + click-to-browse file picker that encodes the
 * chosen file as base64 into hidden inputs for a plain server-action form post.
 *
 * Round 4 uses it for offer-letter upload: the recruiter drops a real PDF, and
 * on submit the server action receives the file's base64 payload and filename
 * directly from the form — no client fetch, no multipart plumbing. The atom
 * reads the file with `FileReader.readAsDataURL`, then strips the
 * `data:<mime>;base64,` prefix so the hidden `<input>` carries only the raw
 * base64 string (the server reconstructs the blob and checksums it).
 *
 * Validation happens entirely client-side as an early guard: the file must
 * match `accept` (a comma-separated list of MIME types, default
 * `application/pdf`) and stay within `maxBytes` (default ~2.8 MB, matching the
 * offer-letter store cap). On rejection the chosen file is discarded, the hidden
 * inputs are cleared, and a `role="alert"` message explains why. The server is
 * still the source of truth — this is fast feedback, not the security boundary.
 *
 * `onFile` is an optional callback fired with the accepted `File` (e.g. to show
 * a preview); the component itself only needs the hidden inputs to do its job.
 *
 * Reads only semantic design tokens (`var(--...)`), mirroring the other atoms.
 */

export interface FileUploadProps {
  /** Hidden input name carrying the raw base64 payload (no data-URL prefix). */
  readonly name: string;
  /** Hidden input name carrying the original filename. Defaults to
   *  `${name}FileName`. */
  readonly fileNameField?: string;
  /** Accept filter — comma-separated MIME types. Defaults to `application/pdf`.
   *  Also passed through to the native file dialog. */
  readonly accept?: string;
  /** Maximum accepted size in bytes. Defaults to 2_800_000 (~2.8 MB). */
  readonly maxBytes?: number;
  /** Accessible label for the drop zone. */
  readonly label?: string;
  /** Helper text shown under the prompt (e.g. "PDF up to 2.8 MB"). */
  readonly hint?: string;
  /** Fired with the accepted File once it passes validation. */
  readonly onFile?: (file: File) => void;
  /** Disable the control. */
  readonly disabled?: boolean;
}

const DEFAULT_MAX_BYTES = 2_800_000;
const DEFAULT_ACCEPT = 'application/pdf';

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

/** Strip the `data:<mime>;base64,` prefix, returning only the base64 payload. */
function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(stripDataUrlPrefix(result));
      } else {
        reject(new Error('Unexpected non-text FileReader result'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function acceptMatches(file: File, accept: string): boolean {
  const patterns = accept
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);
  if (patterns.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return name.endsWith(pattern);
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}

const zoneBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  width: '100%',
  padding: 'var(--space-8) var(--space-6)',
  textAlign: 'center',
  borderRadius: 'var(--radius-3)',
  border: '1.5px dashed var(--input-border)',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-secondary)',
  transition:
    'border-color var(--motion-micro), background-color var(--motion-micro), color var(--motion-micro)',
};

export function FileUpload({
  name,
  fileNameField,
  accept = DEFAULT_ACCEPT,
  maxBytes = DEFAULT_MAX_BYTES,
  label = 'Upload a file',
  hint,
  onFile,
  disabled = false,
}: FileUploadProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const nameField = fileNameField ?? `${name}FileName`;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const base64Ref = useRef<HTMLInputElement | null>(null);
  const filenameRef = useRef<HTMLInputElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<{ fileName: string; size: number } | null>(null);

  const clearHidden = useCallback(() => {
    if (base64Ref.current) base64Ref.current.value = '';
    if (filenameRef.current) filenameRef.current.value = '';
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;
      if (!acceptMatches(file, accept)) {
        setError(`That file type isn't allowed. Expected: ${accept}.`);
        setAccepted(null);
        clearHidden();
        return;
      }
      if (file.size > maxBytes) {
        setError(`File is too large (${formatBytes(file.size)}). Max ${formatBytes(maxBytes)}.`);
        setAccepted(null);
        clearHidden();
        return;
      }
      try {
        const base64 = await readFileAsBase64(file);
        if (base64Ref.current) base64Ref.current.value = base64;
        if (filenameRef.current) filenameRef.current.value = file.name;
        setError(null);
        setAccepted({ fileName: file.name, size: file.size });
        onFile?.(file);
      } catch {
        setError('Could not read that file. Please try again.');
        setAccepted(null);
        clearHidden();
      }
    },
    [disabled, accept, maxBytes, onFile, clearHidden],
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const openDialog = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const onZoneKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDialog();
      }
    },
    [openDialog],
  );

  const onDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [disabled, handleFile],
  );

  const onDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) setDragging(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
  }, []);

  const describedBy = error ? errorId : undefined;

  return (
    <div style={{ display: 'block' }}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        aria-describedby={describedBy}
        onClick={openDialog}
        onKeyDown={onZoneKeyDown}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          ...zoneBaseStyle,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          ...(dragging
            ? { borderColor: 'var(--accent)', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }
            : {}),
          ...(error ? { borderColor: 'var(--input-error-border)' } : {}),
        }}
      >
        <UploadGlyph />
        <span style={{ fontFamily: 'var(--ff-sans)', fontSize: 'var(--fs-16)', color: 'var(--text-primary)' }}>
          {accepted ? accepted.fileName : label}
        </span>
        <span style={{ fontFamily: 'var(--ff-sans)', fontSize: 'var(--fs-12)' }}>
          {accepted
            ? `${formatBytes(accepted.size)} · click to replace`
            : (hint ?? `Drag & drop or click to browse — max ${formatBytes(maxBytes)}`)}
        </span>
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={onInputChange}
        // Visually hidden but still operable via the zone's click() proxy.
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input ref={base64Ref} type="hidden" name={name} defaultValue="" />
      <input ref={filenameRef} type="hidden" name={nameField} defaultValue="" />

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            marginTop: 'var(--space-2)',
            fontFamily: 'var(--ff-sans)',
            fontSize: 'var(--fs-12)',
            fontWeight: 'var(--fw-500)',
            color: 'var(--input-error-text)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function UploadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={28}
      height={28}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', color: 'var(--text-secondary)' }}
    >
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
