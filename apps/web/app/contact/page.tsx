import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { PLACEMENT_HEADS } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Contact · NID Industry Interface',
  description:
    'Placements Office for the Ahmedabad, Gandhinagar, and Bengaluru campuses, and the Assistant Registrar (Industry, Placements, Students & Alumni Relations).',
};

/**
 * Per-campus Placements Office details. `PLACEMENT_HEADS` (recruiter-public.ts)
 * carries the placement head's name + email + remit per campus; the postal
 * address and the office phone/inbox are not modelled there, so they are added
 * inline here — mirroring how the live II portal lists one Placements Office
 * block per campus. Keyed by `PlacementHead.campus`.
 */
interface CampusOffice {
  readonly addressLines: readonly string[];
  readonly phone: string;
  readonly officeEmail: string;
}

const CAMPUS_OFFICES: Readonly<Record<string, CampusOffice>> = {
  Ahmedabad: {
    addressLines: [
      'Placements Office, National Institute of Design',
      'Paldi, Ahmedabad 380007',
      'Gujarat, India',
    ],
    phone: '+91 79 2662 3692',
    officeEmail: 'placements-ahm@nid.edu',
  },
  Gandhinagar: {
    addressLines: [
      'Placements Office, NID Gandhinagar Campus',
      'GH-0, Sector 23, Gandhinagar 382023',
      'Gujarat, India',
    ],
    phone: '+91 79 2326 5500',
    officeEmail: 'placements-gnr@nid.edu',
  },
  Bengaluru: {
    addressLines: [
      'Placements Office, NID R&D Campus',
      '12 HMT Link Road, Off Tumkur Road, Yelahanka',
      'Bengaluru 560022, Karnataka, India',
    ],
    phone: '+91 80 2839 5901',
    officeEmail: 'placements-blr@nid.edu',
  },
};

/**
 * The Assistant Registrar heads Industry, Placements, Students & Alumni
 * Relations and sits at the founding (Ahmedabad) campus. She is the Ahmedabad
 * entry in `PLACEMENT_HEADS`; resolved by campus (rather than index) so the
 * lookup is robust to seed reordering and narrows cleanly under
 * noUncheckedIndexedAccess. Her direct office line + the central correspondence
 * address are added inline (not modelled on `PlacementHead`).
 */
const ASSISTANT_REGISTRAR = ((): (typeof PLACEMENT_HEADS)[number] => {
  const head = PLACEMENT_HEADS.find((h) => h.campus === 'Ahmedabad');
  if (!head) throw new Error('PLACEMENT_HEADS seed is missing the Ahmedabad campus head');
  return head;
})();
const REGISTRAR_OFFICE = {
  role: 'Assistant Registrar — Industry, Placements, Students & Alumni Relations',
  phone: '+91 79 2662 3463',
  addressLines: [
    'Office of the Assistant Registrar (IPSAR)',
    'National Institute of Design, Paldi',
    'Ahmedabad 380007, Gujarat, India',
  ],
} as const;

export default function ContactIndexPage() {
  return (
    <PageShell activeNav="contact">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p style={kicker}>Contact</p>
          <h1 style={h1}>Placements Office</h1>
          <p style={lede}>
            Recruitment is run from the Placements Office at each of the three campuses. Reach the office for the campus
            you want to recruit from below, or write to the Assistant Registrar for institute-wide placement matters.
          </p>

          <div style={officeGrid}>
            {PLACEMENT_HEADS.map((head) => {
              const office = CAMPUS_OFFICES[head.campus];
              if (!office) return null;
              return (
                <div key={head.campus} style={card}>
                  <p style={accentKicker}>{head.campus} campus</p>
                  <h2 style={cardTitle}>Placements Office</h2>

                  <address style={addressBlock}>
                    {office.addressLines.map((line) => (
                      <span key={line} style={addressLine}>
                        {line}
                      </span>
                    ))}
                  </address>

                  <dl style={contactList}>
                    <div style={contactRow}>
                      <dt style={contactLabel}>Phone</dt>
                      <dd style={contactValue}>
                        <a href={`tel:${office.phone.replace(/\s+/g, '')}`} style={link}>
                          {office.phone}
                        </a>
                      </dd>
                    </div>
                    <div style={contactRow}>
                      <dt style={contactLabel}>Office</dt>
                      <dd style={contactValue}>
                        <a href={`mailto:${office.officeEmail}`} style={link}>
                          {office.officeEmail}
                        </a>
                      </dd>
                    </div>
                    <div style={contactRow}>
                      <dt style={contactLabel}>Placement head</dt>
                      <dd style={contactValue}>
                        <span style={headName}>{head.name}</span>
                        <a href={`mailto:${head.email}`} style={link}>
                          {head.email}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>

          <div style={registrarCard}>
            <p style={accentKicker}>Institute-wide</p>
            <h2 style={cardTitle}>{ASSISTANT_REGISTRAR.name}</h2>
            <p style={registrarRole}>{REGISTRAR_OFFICE.role}</p>

            <div style={registrarBody}>
              <address style={addressBlock}>
                {REGISTRAR_OFFICE.addressLines.map((line) => (
                  <span key={line} style={addressLine}>
                    {line}
                  </span>
                ))}
              </address>

              <dl style={contactList}>
                <div style={contactRow}>
                  <dt style={contactLabel}>Phone</dt>
                  <dd style={contactValue}>
                    <a href={`tel:${REGISTRAR_OFFICE.phone.replace(/\s+/g, '')}`} style={link}>
                      {REGISTRAR_OFFICE.phone}
                    </a>
                  </dd>
                </div>
                <div style={contactRow}>
                  <dt style={contactLabel}>Email</dt>
                  <dd style={contactValue}>
                    <a href={`mailto:${ASSISTANT_REGISTRAR.email}`} style={link}>
                      {ASSISTANT_REGISTRAR.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};
const h1 = {
  fontSize: 'var(--fs-48)',
  lineHeight: 'var(--lh-56)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-4)',
};
const lede = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  maxWidth: '720px',
};
const officeGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-8)',
} as const;
const card = {
  backgroundColor: 'var(--card-bg)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
  boxShadow: 'var(--card-shadow)',
  borderTop: '3px solid var(--accent)',
} as const;
const accentKicker = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};
const cardTitle = {
  fontSize: 'var(--fs-20)',
  lineHeight: 'var(--lh-28)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginTop: 'var(--space-1)',
};
const addressBlock = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--space-1)',
  marginTop: 'var(--space-3)',
  fontStyle: 'normal' as const,
};
const addressLine = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-secondary)',
};
const contactList = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--space-3)',
  marginTop: 'var(--space-4)',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--border-default)',
};
const contactRow = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' } as const;
const contactLabel = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};
const contactValue = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' } as const;
const headName = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
};
const link = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textDecoration: 'none',
};
const registrarCard = {
  backgroundColor: 'var(--card-bg)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding-loose)',
  boxShadow: 'var(--card-shadow)',
  borderTop: '3px solid var(--accent)',
  marginTop: 'var(--space-6)',
} as const;
const registrarRole = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-primary)',
  marginTop: 'var(--space-1)',
};
const registrarBody = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 'var(--space-6)',
  marginTop: 'var(--space-4)',
} as const;
