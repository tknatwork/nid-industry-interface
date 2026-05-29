/**
 * Public-content seed for the unauthenticated surfaces (Phase 3.2). Static demo
 * data — in production this is admin-managed content + the discipline taxonomy
 * from the DB. Kept in apps/web/lib because these are presentation-only pages
 * (no store, no mutation).
 */

export type DisciplineTheme =
  | 'communication'
  | 'industrial'
  | 'textile'
  | 'animation'
  | 'ux'
  | 'furniture';

export interface Discipline {
  readonly slug: string;
  readonly name: string;
  readonly programme: string;
  readonly theme: DisciplineTheme;
  readonly summary: string;
  readonly whatTheyDo: readonly string[];
  readonly sampleWork: string;
}

export const DISCIPLINES: readonly Discipline[] = [
  {
    slug: 'communication-design',
    name: 'Communication Design',
    programme: 'B.Des / M.Des',
    theme: 'communication',
    summary: 'Visual systems, typography, brand, editorial, and motion graphics.',
    whatTheyDo: ['Brand + identity systems', 'Editorial + publication design', 'Typography + lettering', 'Motion + title design'],
    sampleWork: 'Identity systems, books, exhibition graphics, campaign films.',
  },
  {
    slug: 'graphic-design',
    name: 'Graphic Design',
    programme: 'M.Des',
    theme: 'communication',
    summary: 'Brand, packaging, and print-to-screen visual craft.',
    whatTheyDo: ['Packaging systems', 'Brand collateral', 'Print + screen layout'],
    sampleWork: 'Packaging ranges, brand guidelines, poster series.',
  },
  {
    slug: 'interaction-design',
    name: 'Interaction Design',
    programme: 'M.Des',
    theme: 'ux',
    summary: 'UX research, interaction patterns, and human-centred systems.',
    whatTheyDo: ['Generative + evaluative research', 'Flows + prototypes', 'Design systems', 'Service blueprints'],
    sampleWork: 'Fintech + health + public-service product case studies.',
  },
  {
    slug: 'product-design',
    name: 'Product Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Hardware + software product design, end to end.',
    whatTheyDo: ['Concept → CMF → CAD', 'Hardware + software integration', 'Design for manufacture'],
    sampleWork: 'Shipped consumer devices, sustainability-driven product theses.',
  },
  {
    slug: 'industrial-design',
    name: 'Industrial Design',
    programme: 'B.Des',
    theme: 'industrial',
    summary: 'Form, function, and manufacturability across consumer and B2B products.',
    whatTheyDo: ['Form-giving', 'Ergonomics', 'Materials + processes'],
    sampleWork: 'Appliances, mobility, tools, medical devices.',
  },
  {
    slug: 'furniture-interior-design',
    name: 'Furniture & Interior Design',
    programme: 'M.Des',
    theme: 'furniture',
    summary: 'Spatial design, furniture, and interior product.',
    whatTheyDo: ['Spatial planning', 'Furniture systems', 'Material + joinery detailing'],
    sampleWork: 'Retail + workspace interiors, modular furniture systems.',
  },
  {
    slug: 'textile-design',
    name: 'Textile Design',
    programme: 'B.Des / M.Des',
    theme: 'textile',
    summary: 'Fabric, surface, and material across apparel and home textiles.',
    whatTheyDo: ['Weave + print + surface', 'Material innovation', 'Collection development'],
    sampleWork: 'Apparel collections, home-textile ranges, craft collaborations.',
  },
  {
    slug: 'animation-film-design',
    name: 'Animation Film Design',
    programme: 'M.Des',
    theme: 'animation',
    summary: '2D, 3D, and stop-motion for film, advertising, and interactive media.',
    whatTheyDo: ['Character + motion', 'Story + direction', 'Compositing + post'],
    sampleWork: 'Short films, ad spots, explainer + title sequences.',
  },
];

export function disciplineBySlug(slug: string): Discipline | null {
  return DISCIPLINES.find((d) => d.slug === slug) ?? null;
}

export interface Cycle {
  readonly slug: string;
  readonly label: string;
  readonly status: 'open' | 'upcoming' | 'closed';
  readonly feeRupees: number;
  readonly applyOpens: string;
  readonly jdDeadline: string;
  readonly browseOpens: string;
  readonly interviewWindow: string;
  readonly offerBy: string;
  readonly eligibleDisciplines: readonly string[];
}

export const CYCLES: readonly Cycle[] = [
  {
    slug: 'spring-2026',
    label: 'Spring 2026',
    status: 'open',
    feeRupees: 15000,
    applyOpens: '14 Apr 2026',
    jdDeadline: '14 May 2026',
    browseOpens: '23 May 2026',
    interviewWindow: '1–5 Jun 2026',
    offerBy: '10 Jun 2026',
    eligibleDisciplines: DISCIPLINES.map((d) => d.slug),
  },
  {
    slug: 'autumn-2025',
    label: 'Autumn 2025',
    status: 'closed',
    feeRupees: 15000,
    applyOpens: '10 Sep 2025',
    jdDeadline: '12 Oct 2025',
    browseOpens: '20 Oct 2025',
    interviewWindow: '18–22 Nov 2025',
    offerBy: '30 Nov 2025',
    eligibleDisciplines: DISCIPLINES.map((d) => d.slug),
  },
];

export function cycleBySlug(slug: string): Cycle | null {
  return CYCLES.find((c) => c.slug === slug) ?? null;
}

export interface Campus {
  readonly slug: string;
  readonly name: string;
  readonly programmes: string;
  readonly blurb: string;
}

export const CAMPUSES: readonly Campus[] = [
  { slug: 'ahmedabad', name: 'NID Ahmedabad', programmes: 'PhD · Masters · Bachelors', blurb: 'The founding campus — the only one hosting Bachelors alongside Masters and PhD.' },
  { slug: 'gandhinagar', name: 'NID Gandhinagar', programmes: 'Masters · PhD-primary', blurb: 'Masters-focused, with research depth across communication and textile.' },
  { slug: 'bengaluru', name: 'NID Bengaluru (R&D)', programmes: 'Masters · PhD-primary', blurb: 'The R&D campus — interaction, digital, and product research.' },
];

export interface BachelorCampus {
  readonly name: string;
  readonly location: string;
  readonly note: string;
}

export const BACHELOR_CAMPUSES: readonly BachelorCampus[] = [
  { name: 'NID Andhra Pradesh', location: 'Vijayawada', note: 'Builds its own Bachelors recruiter portal on top of II APIs.' },
  { name: 'NID Madhya Pradesh', location: 'Bhopal', note: 'API consumer — separate Bachelors intake.' },
  { name: 'NID Assam', location: 'Jorhat', note: 'API consumer — separate Bachelors intake.' },
  { name: 'NID Haryana', location: 'Kurukshetra', note: 'API consumer — separate Bachelors intake.' },
];
