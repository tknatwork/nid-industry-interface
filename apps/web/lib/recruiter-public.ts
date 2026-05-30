/**
 * Recruiter-facing public-content seed (Phase 3.2 / Phase 4 public surfaces).
 * Presentation-only demo data for the unauthenticated recruiter hub, contact
 * directories, public placement reports, and company microsites. In production
 * this is admin-managed content joined against the recruiter + redressal tables;
 * here it is static so the pages stay store-free server components.
 *
 * The MICROSITES companyName strings MUST stay in lock-step with the seeded
 * companyName values in modules/admin-accountability — the transparency tab
 * joins redressal cases on the exact company name.
 */

export interface ProcessStep {
  readonly step: number;
  readonly title: string;
  readonly detail: string;
}

/** The real recruiter flow: apply (no login) → pay → track → verify → credentials → post JD → browse → offer. */
export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    step: 1,
    title: 'Apply — no login required',
    detail:
      'Submit a short application from the public site. There is no account to create up front; you describe your organisation, the roles, and the campuses you want to recruit from.',
  },
  {
    step: 2,
    title: 'Pay the participation fee',
    detail:
      'A flat per-cycle participation fee (currently ₹15,000 + GST) confirms intent. It is non-refundable and is unrelated to any later hiring outcome.',
  },
  {
    step: 3,
    title: 'Get a tracking token',
    detail:
      'You receive a token immediately. Use it on the public tracker to follow your application through every step — no email back-and-forth, no login.',
  },
  {
    step: 4,
    title: 'Admin verifies your organisation',
    detail:
      'The placement office reviews the application, confirms the organisation is genuine, and checks the roles against eligibility and the stipend floor.',
  },
  {
    step: 5,
    title: 'Credentials issued',
    detail:
      'Once verified you are issued recruiter credentials and a recruiter ID. This is the first point at which you log in — the portal opens for the active cycle.',
  },
  {
    step: 6,
    title: 'Post a job description',
    detail:
      'Draft a JD in the portal. An analyzer flags scope-creep (engineering work bundled onto a design brief) and the stipend floor is checked at both ends of the salary range before you can publish. Published JDs are immutable.',
  },
  {
    step: 7,
    title: 'Browse and individually shortlist',
    detail:
      'Browse applicants for your published JD and evaluate each one individually, with a required note. There is no bulk shortlist and no demographic sort or filter — the institution does not let the portal pre-rank students.',
  },
  {
    step: 8,
    title: 'Interview and run the offer cascade',
    detail:
      'Book interview slots, paste your own meeting link, and extend offers in waves. The offer cascade releases the next wave only as earlier offers are accepted or lapse.',
  },
];

export interface FaqItem {
  readonly q: string;
  readonly a: string;
}

export const FAQ: readonly FaqItem[] = [
  {
    q: 'Is the participation fee refundable?',
    a: 'No. The per-cycle participation fee is non-refundable and is independent of whether you make any hires. It covers the cost of running the cycle, not a placement guarantee.',
  },
  {
    q: 'Which disciplines can I recruit from?',
    a: 'Roughly twenty design disciplines across communication, industrial/product, textile, animation, interaction/UX, and furniture & interior design. The public Disciplines catalog maps recruiter roles to the disciplines whose graduates actually fit.',
  },
  {
    q: 'Who is eligible to be recruited?',
    a: 'Graduating students only: B.Des in their 7th/8th semester and M.Des in their 4th/5th semester. Earlier-year students are not part of the placement cycle.',
  },
  {
    q: 'Does paying the fee guarantee a placement?',
    a: 'No. There is no placement guarantee at any point. The fee buys access to the cycle; hiring outcomes depend entirely on your roles, your evaluation, and student acceptance.',
  },
  {
    q: 'How are stipend and salary floors enforced?',
    a: 'NID publishes compensation floors by programme and role type. For full-time roles the floor is checked at both ends of the salary range; roles that bundle engineering work onto a design brief carry a higher floor. Use the public stipend calculator before you apply.',
  },
  {
    q: 'Can I do lateral or experienced hiring through this portal?',
    a: 'No. The Industry Interface portal is for graduating-batch campus placement. Lateral and experienced hiring sits outside this system — contact the placement office directly to discuss alumni channels.',
  },
  {
    q: 'What is the graduation-project (GP) fee?',
    a: 'A graduation-project engagement carries a fee of ₹5,000 per intern, invoiced to the recruiter — never to the student. It is separate from the cycle participation fee.',
  },
  {
    q: 'How do I get in touch during a cycle?',
    a: 'Each campus has student coordinators and a placement head; an escalation chain runs from the student coordinator up to the Director. See the Contact section for the per-campus directory.',
  },
];

export interface GuidelineSection {
  readonly heading: string;
  readonly body: string;
}

export const GUIDELINES: readonly GuidelineSection[] = [
  {
    heading: 'Eligibility',
    body: 'Recruitment is limited to graduating students — B.Des (7th/8th semester) and M.Des (4th/5th semester). Recruiters must describe genuine roles for which NID design graduates are a fit; the placement office maps your role vocabulary to the relevant disciplines and may decline roles that do not match the graduating cohort.',
  },
  {
    heading: 'Fees and GST',
    body: 'A flat per-cycle participation fee (currently ₹15,000) plus applicable GST is payable up front and is non-refundable. Graduation-project engagements carry a separate fee of ₹5,000 per intern, invoiced to the recruiter. No fee of any kind is ever charged to a student.',
  },
  {
    heading: 'Job-description structure',
    body: 'Each JD must state the role, location, programme/discipline fit, and a salary or stipend range. The portal analyzer flags scope-creep where engineering or unrelated technical work is bundled onto a design brief; such roles carry a higher compensation floor. Published JDs are immutable — corrections are issued as a new JD chained to the original.',
  },
  {
    heading: 'Conduct during the cycle',
    body: 'Evaluate students individually with a recorded note. Bulk shortlisting, demographic sorting or filtering, and any black-box ranking of candidates are not permitted. Honour booked interview slots and published offer timelines; repeated no-shows or offer reneging are logged against your recruiter health score.',
  },
  {
    heading: 'Intellectual property and portfolios',
    body: 'Student portfolios shared during recruitment remain the intellectual property of the student. They may be used solely to evaluate the candidate for the advertised role and must not be reproduced, redistributed, or used to brief unrelated work. Any take-home exercise must be scoped, time-bound, and disclosed up front.',
  },
  {
    heading: 'Redressal',
    body: 'Students may file a redressal complaint against a recruiter (for example, for fee demands, IPR misuse, or offer reneging). Complaints are adjudicated by the placement office; upheld cases adjust the recruiter health score and may, in serious cases, lead to revocation of portal access. Anonymised, aggregate redressal statistics for the last five years are published on each company microsite.',
  },
];

export interface PastRecruiter {
  readonly name: string;
  readonly sector: string;
  readonly year: number;
  readonly disciplines: readonly string[];
}

/** ~5 years of past recruiters across sectors (2021–2026). Plausible, not contractual. */
export const PAST_RECRUITERS: readonly PastRecruiter[] = [
  { name: 'Tata Motors', sector: 'Auto', year: 2026, disciplines: ['Product Design', 'Industrial Design'] },
  { name: 'Microsoft', sector: 'Tech', year: 2026, disciplines: ['Interaction Design', 'Communication Design'] },
  { name: 'Myntra', sector: 'E-commerce', year: 2026, disciplines: ['Textile Design', 'Communication Design'] },
  { name: 'Titan', sector: 'FMCG', year: 2025, disciplines: ['Industrial Design', 'Furniture & Interior Design'] },
  { name: 'Infosys', sector: 'Consulting', year: 2025, disciplines: ['Interaction Design'] },
  { name: 'Hero MotoCorp', sector: 'Auto', year: 2025, disciplines: ['Product Design', 'Industrial Design'] },
  { name: 'BookMyShow', sector: 'Media', year: 2025, disciplines: ['Animation Film Design', 'Interaction Design'] },
  { name: 'Hindustan Unilever', sector: 'FMCG', year: 2024, disciplines: ['Graphic Design', 'Communication Design'] },
  { name: 'Flipkart', sector: 'E-commerce', year: 2024, disciplines: ['Interaction Design'] },
  { name: 'Mahindra', sector: 'Auto', year: 2024, disciplines: ['Product Design'] },
  { name: 'Deloitte Digital', sector: 'Consulting', year: 2023, disciplines: ['Interaction Design', 'Graphic Design'] },
  { name: 'Zomato', sector: 'E-commerce', year: 2023, disciplines: ['Communication Design', 'Animation Film Design'] },
  { name: 'Wipro', sector: 'Tech', year: 2022, disciplines: ['Interaction Design'] },
  { name: 'Star India', sector: 'Media', year: 2022, disciplines: ['Animation Film Design'] },
  { name: 'ITC', sector: 'FMCG', year: 2021, disciplines: ['Graphic Design', 'Textile Design'] },
  { name: 'Godrej', sector: 'Auto', year: 2021, disciplines: ['Industrial Design', 'Furniture & Interior Design'] },
];

export interface RecruiterLogo {
  /** Display name, used for the alt text and the wordmark-tile fallback. */
  readonly name: string;
  /**
   * simple-icons slug (lowercase brand id, e.g. `microsoft`, `ibm`). The
   * RecruiterLogo component resolves this against the offline `simple-icons`
   * package at render time; any slug not present in the installed set (a brand
   * simple-icons doesn't carry, or a renamed slug) degrades gracefully to a
   * monochrome wordmark tile built from `name` — so this list never breaks the
   * wall, it just picks the fallback for the few that miss.
   */
  readonly slug: string;
}

/**
 * ~50 logos for the homepage recruiter logo wall (Round 2 §B). Builds on the
 * PAST_RECRUITERS names above and adds well-known firms that recruit from NID
 * across its design disciplines (auto/mobility, tech & product, FMCG/retail,
 * consulting, media/animation, electronics, and Indian design-led startups).
 * Presentation-only and non-contractual — the same posture as PAST_RECRUITERS.
 * Slugs follow the simple-icons convention (lowercase, no spaces/punctuation).
 */
export const RECRUITER_LOGOS: readonly RecruiterLogo[] = [
  // — from PAST_RECRUITERS —
  { name: 'Tata Motors', slug: 'tatamotors' },
  { name: 'Microsoft', slug: 'microsoft' },
  { name: 'Myntra', slug: 'myntra' },
  { name: 'Titan', slug: 'titan' },
  { name: 'Infosys', slug: 'infosys' },
  { name: 'Hero MotoCorp', slug: 'heromotocorp' },
  { name: 'BookMyShow', slug: 'bookmyshow' },
  { name: 'Flipkart', slug: 'flipkart' },
  { name: 'Mahindra', slug: 'mahindra' },
  { name: 'Deloitte', slug: 'deloitte' },
  { name: 'Zomato', slug: 'zomato' },
  { name: 'Wipro', slug: 'wipro' },
  { name: 'ITC', slug: 'itchotel' },
  { name: 'Godrej', slug: 'godrej' },
  // — tech & product —
  { name: 'IBM', slug: 'ibm' },
  { name: 'Oracle', slug: 'oracle' },
  { name: 'SAP', slug: 'sap' },
  { name: 'Adobe', slug: 'adobe' },
  { name: 'Google', slug: 'google' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Amazon', slug: 'amazon' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Intel', slug: 'intel' },
  { name: 'Cisco', slug: 'cisco' },
  { name: 'Dell', slug: 'dell' },
  { name: 'Accenture', slug: 'accenture' },
  // — electronics & industrial —
  { name: 'Philips', slug: 'philips' },
  { name: 'Sony', slug: 'sony' },
  { name: 'Panasonic', slug: 'panasonic' },
  { name: 'LG', slug: 'lg' },
  { name: 'Bosch', slug: 'bosch' },
  { name: 'Siemens', slug: 'siemens' },
  { name: 'General Electric', slug: 'generalelectric' },
  { name: 'Dyson', slug: 'dyson' },
  // — auto & mobility —
  { name: 'BMW', slug: 'bmw' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Mercedes-Benz', slug: 'mercedes' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Royal Enfield', slug: 'royalenfield' },
  // — retail, FMCG & lifestyle —
  { name: 'Unilever', slug: 'unilever' },
  { name: 'Decathlon', slug: 'decathlon' },
  { name: 'IKEA', slug: 'ikea' },
  { name: 'Nike', slug: 'nike' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Puma', slug: 'puma' },
  { name: 'Lego', slug: 'lego' },
  { name: 'Muji', slug: 'muji' },
  // — media, design-led & Indian startups —
  { name: 'Netflix', slug: 'netflix' },
  { name: 'Spotify', slug: 'spotify' },
  { name: 'Airbnb', slug: 'airbnb' },
  { name: 'Swiggy', slug: 'swiggy' },
  { name: 'Paytm', slug: 'paytm' },
  { name: 'PhonePe', slug: 'phonepe' },
  { name: 'Razorpay', slug: 'razorpay' },
  { name: 'Zoho', slug: 'zoho' },
  { name: 'Freshworks', slug: 'freshworks' },
  { name: 'Canva', slug: 'canva' },
  { name: 'Figma', slug: 'figma' },
];

export interface PlacementHead {
  readonly campus: string;
  readonly name: string;
  readonly email: string;
  readonly bio: string;
}

/**
 * One placement head per campus. This is a rotating, long-cadence appointment
 * (faculty serve a multi-year term), so names change slowly across cycles.
 */
export const PLACEMENT_HEADS: readonly PlacementHead[] = [
  {
    campus: 'Ahmedabad',
    name: 'Sujitha Nair',
    email: 'placement-head-ahm@nid.edu',
    bio: 'Faculty in Communication Design at the founding campus. Oversees the full Bachelors + Masters placement cycle and chairs the cross-campus coordination call.',
  },
  {
    campus: 'Gandhinagar',
    name: 'Rohit Desai',
    email: 'placement-head-gnr@nid.edu',
    bio: 'Faculty in Textile Design. Leads the Masters-focused Gandhinagar cycle and the institution’s craft-cluster recruiter relationships.',
  },
  {
    campus: 'Bengaluru',
    name: 'Anjali Menon',
    email: 'placement-head-blr@nid.edu',
    bio: 'Faculty in Interaction Design at the R&D campus. Coordinates digital, product, and interaction recruiters and the lateral research collaborations.',
  },
];

export interface Coordinator {
  /** Stable id (`COORD-<campus-letter>-<n>`). Survives across cycles for demo linking. */
  readonly id: string;
  readonly name: string;
  /** The recruiting company this coordinator is assigned to for the cycle. */
  readonly company: string;
  /**
   * Recruiter id of the assigned company, when that company exists as a seeded
   * recruiter (matches MICROSITES.recruiterId / the onboarding ids). Lets the
   * dashboard resolve "who is my coordinator?" by recruiter id. Omitted for
   * past/illustrative companies that have no live recruiter record.
   */
  readonly recruiterId?: string;
}

export interface CampusCoordinators {
  readonly campus: string;
  readonly coordinators: readonly Coordinator[];
}

/** Student coordinators per campus, each assigned to a recruiting company for the cycle. */
export const COORDINATORS: readonly CampusCoordinators[] = [
  {
    campus: 'Ahmedabad',
    coordinators: [
      // Acme Design Studio is the seeded primary recruiter (NID-2026-A-0001,
      // Ahmedabad) — give it an assigned coordinator so the dashboard Contacts
      // section (§K) can resolve one. (Fills the earlier data gap.)
      { id: 'COORD-A-1', name: 'Aanya Kulkarni', company: 'Acme Design Studio', recruiterId: 'NID-2026-A-0001' },
      { id: 'COORD-A-2', name: 'Kabir Shah', company: 'Tata Motors' },
      { id: 'COORD-A-3', name: 'Ira Sharma', company: 'Microsoft' },
      { id: 'COORD-A-4', name: 'Devansh Patel', company: 'Myntra' },
    ],
  },
  {
    campus: 'Gandhinagar',
    coordinators: [
      { id: 'COORD-G-1', name: 'Meera Iyer', company: 'Titan' },
      { id: 'COORD-G-2', name: 'Aryan Gupta', company: 'Infosys' },
    ],
  },
  {
    campus: 'Bengaluru',
    coordinators: [
      { id: 'COORD-B-1', name: 'Sara Thomas', company: 'BookMyShow' },
      { id: 'COORD-B-2', name: 'Nikhil Rao', company: 'Hero MotoCorp' },
      { id: 'COORD-B-3', name: 'Tara Krishnan', company: 'Flipkart' },
    ],
  },
];

export interface CoordinatorWithCampus extends Coordinator {
  readonly campus: string;
}

/** Flat view of every coordinator with its campus, for lookups. */
export const ALL_COORDINATORS: readonly CoordinatorWithCampus[] = COORDINATORS.flatMap((c) =>
  c.coordinators.map((coord) => ({ ...coord, campus: c.campus })),
);

/**
 * Resolve the student coordinator assigned to a given recruiter id.
 * Used by the recruiter dashboard Contacts section (§K) to show "your
 * coordinator" alongside the campus placement head. Returns `null` when the
 * recruiter has no assigned coordinator in this cycle's seed.
 */
export function coordinatorForRecruiter(recruiterId: string): CoordinatorWithCampus | null {
  return ALL_COORDINATORS.find((c) => c.recruiterId === recruiterId) ?? null;
}

/** Escalation chain for any unresolved recruiter or student concern. */
export const ESCALATION: readonly string[] = [
  'Student coordinator',
  'Faculty coordinator',
  'Placement head',
  'Registrar',
  'Director',
];

export interface PlacementReport {
  readonly cycle: string;
  readonly students: number;
  readonly offers: number;
  readonly highCtcLakh: number;
  readonly lowCtcLakh: number;
}

export const REPORTS: readonly PlacementReport[] = [
  { cycle: 'Autumn 2025', students: 312, offers: 287, highCtcLakh: 42, lowCtcLakh: 8 },
  { cycle: 'Spring 2025', students: 298, offers: 261, highCtcLakh: 38, lowCtcLakh: 7.5 },
  { cycle: 'Autumn 2024', students: 305, offers: 270, highCtcLakh: 36, lowCtcLakh: 7 },
];

export interface MicrositeRecord {
  readonly companyName: string;
  readonly since: string;
  readonly sectors: readonly string[];
  readonly recruiterId: string;
}

/**
 * Public company microsites. Keys are the public slugs. companyName MUST match
 * the seeded companyName in @nid/module-admin-accountability exactly — the
 * transparency tab joins anonymised redressal cases on this string.
 */
export const MICROSITES: Readonly<Record<string, MicrositeRecord>> = {
  'acme-design-studio': {
    companyName: 'Acme Design Studio',
    since: '2021',
    sectors: ['Tech', 'Consulting'],
    recruiterId: 'NID-2026-A-0001',
  },
  'pixel-forge': {
    companyName: 'Pixel Forge',
    since: '2023',
    sectors: ['Media', 'E-commerce'],
    recruiterId: 'NID-2026-B-0012',
  },
  'ghostcorp-studios': {
    companyName: 'GhostCorp Studios',
    since: '2022',
    sectors: ['Animation', 'Media'],
    recruiterId: 'NID-2025-A-0003',
  },
  'bauhaus-interiors': {
    companyName: 'Bauhaus Interiors',
    since: '2024',
    sectors: ['Furniture & Interior', 'Retail'],
    recruiterId: 'NID-2026-G-0007',
  },
};

export function micrositeBySlug(slug: string): MicrositeRecord | null {
  return MICROSITES[slug] ?? null;
}

// ── Multi-branch parent companies (plan Round 3 §D) ─────────────────────────
//
// One company can run MULTIPLE branches, each a SEPARATE recruiter account with
// its OWN GST / registration / contacts / credentials / dashboard, grouped under
// a parent company for the institution. The grouping id + branch label live on
// each onboarding ticket (ApplicationTicketRecord.parentCompanyId / branchLabel);
// the parent's human-facing name lives here so surfaces can render "Acme Design
// Studio — Bengaluru" without reaching into the onboarding store for the name.

export interface ParentCompany {
  readonly id: string;
  readonly name: string;
}

/** Registry of parent companies, keyed by the id stored on each branch ticket. */
export const PARENT_COMPANIES: Readonly<Record<string, ParentCompany>> = {
  acme: { id: 'acme', name: 'Acme Design Studio' },
};

// `parentCompanyFor` + `branchLabelFor` live in ./recruiter-branch (server-only):
// they read the onboarding store (node:fs), which must NOT enter this
// client-imported, store-free module. PARENT_COMPANIES (above) stays here as it
// is pure presentation data.
