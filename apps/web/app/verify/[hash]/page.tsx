import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { PageShell, StatusPill } from '@nid/ui';
import { verifyCertificate } from '@nid/module-offer-letters';

export const metadata: Metadata = {
  title: 'Verify offer certificate · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * Public certificate verification (Round 4 §D). A SESSION-LESS RSC — anyone
 * holding an offer-letter certificate hash can confirm it here. No recruiter or
 * student auth; the `/verify/<hash>` path is the certificate's real authority
 * channel (the QR glyph is only a decorative placeholder).
 *
 * `verifyCertificate(hash)` returns a REDACTED {@link CertificateView}: it proves
 * authenticity and which offer the certificate binds, but NEVER the base64 PDF.
 * This page renders only those redacted fields — it must not expose document
 * contents. An unknown / superseded hash yields the "no match" state.
 */
export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  // Next already URL-decodes the route param; guard a second decode so a
  // malformed %xx path falls through to the "no match" state rather than 500ing
  // with a URIError. SHA-256 codes are hex, so the raw value is the common case.
  let code = hash;
  try {
    code = decodeURIComponent(hash);
  } catch {
    code = hash;
  }
  const view = verifyCertificate(code);

  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-12)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={label}>Offer-letter certificate</p>
          <h1 style={h1}>Certificate verification</h1>

          {view === null ? (
            <div style={{ ...card, marginTop: 'var(--space-6)', textAlign: 'center', display: 'grid', gap: 'var(--space-3)', justifyItems: 'center' }}>
              <StatusPill tone="danger">No match</StatusPill>
              <p style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                No certificate matches this code
              </p>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', maxWidth: '46ch' }}>
                The code may be mistyped, or the certificate was superseded by a re-issued letter. Check the link on
                the certificate and try again.
              </p>
              <code style={codeBlock}>{code}</code>
            </div>
          ) : (
            <div style={{ ...card, marginTop: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  <StatusPill tone="success">{view.instituteApproved ? 'Authentic — institute-approved' : 'Authentic'}</StatusPill>
                  <p style={{ fontSize: 'var(--fs-22)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', margin: 0 }}>
                    This offer letter is genuine
                  </p>
                  <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', maxWidth: '52ch' }}>
                    The National Institute of Design certifies this letter was issued through the Industry Interface
                    portal and has not been altered since. The document itself is not shown here.
                  </p>
                </div>
                {/* Decorative verification glyph (placeholder, not a scannable QR). */}
                <img
                  src={view.qrDataUrl}
                  alt="Certificate verification glyph"
                  width={120}
                  height={120}
                  style={{ width: 120, height: 120, flexShrink: 0, borderRadius: 'var(--radius-2)', border: '1px solid var(--card-border)' }}
                />
              </div>

              <dl style={detailGrid}>
                <Detail term="Certificate ID" value={view.certificateId} mono />
                <Detail term="Issued" value={new Date(view.issuedAt).toLocaleString()} />
                <Detail term="Offer reference" value={`${view.jdId} · ${view.studentId}`} mono />
                <Detail term="Wave" value={`Wave ${view.wave}`} />
                <Detail term="Letter revision" value={`v${view.version}`} />
                <Detail term="Document checksum (SHA-256)" value={view.pdfChecksum} mono wrap />
                <Detail term="Verification code" value={view.hash} mono wrap />
              </dl>

              <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-4)', lineHeight: 1.5 }}>
                Authority rests on this SHA-256 verification code and this page — not the glyph. If the checksum on
                your PDF differs from the one above, the document has been modified.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Detail({ term, value, mono = false, wrap = false }: { term: string; value: string; mono?: boolean; wrap?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
      <dt style={detailTerm}>{term}</dt>
      <dd
        style={{
          margin: 0,
          fontSize: 'var(--fs-14)',
          color: 'var(--text-strong)',
          fontFamily: mono ? 'var(--ff-mono, ui-monospace, monospace)' : 'inherit',
          wordBreak: wrap ? 'break-all' : 'normal',
        }}
      >
        {value}
      </dd>
    </div>
  );
}

const label: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' };
const h1: CSSProperties = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card: CSSProperties = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' };
const detailGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-6)',
  paddingTop: 'var(--space-6)',
  borderTop: '1px solid var(--border-default)',
};
const detailTerm: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const codeBlock: CSSProperties = { fontSize: 'var(--fs-12)', fontFamily: 'var(--ff-mono, ui-monospace, monospace)', color: 'var(--text-secondary)', wordBreak: 'break-all', maxWidth: '100%' };
