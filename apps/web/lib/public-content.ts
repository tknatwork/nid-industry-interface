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

/**
 * The full NID discipline taxonomy (20). Names are sourced 1:1 from the
 * jd-posting module's `DISCIPLINES_REF` (modules/jd-posting/src/disciplines-ref.ts),
 * which itself mirrors the @nid/db seed. We don't deep-import that module here
 * (no cross-module deep import; the public surface is presentation-only static
 * content), so the names below are copied — keep them in sync with that ref and
 * the DB seed when either moves. Slugs for the original 8 are preserved so any
 * existing /disciplines/[slug] deep links keep resolving.
 *
 * `programme` here is the recruiter-facing intake label (B.Des / M.Des), distinct
 * from the ref's bachelors/masters/both enum.
 */
export const DISCIPLINES: readonly Discipline[] = [
  {
    slug: 'industrial-design',
    name: 'Industrial Design',
    programme: 'B.Des / M.Des',
    theme: 'industrial',
    summary: 'Form, function, and manufacturability across consumer and B2B products.',
    whatTheyDo: ['Form-giving + concept development', 'Ergonomics + human factors', 'Materials, CMF + processes', 'Design for manufacture'],
    sampleWork: 'Appliances, mobility, hand tools, medical and B2B equipment.',
  },
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
    slug: 'textile-design',
    name: 'Textile Design',
    programme: 'B.Des / M.Des',
    theme: 'textile',
    summary: 'Fabric, surface, and material across apparel and home textiles.',
    whatTheyDo: ['Weave, print + surface development', 'Material + fibre innovation', 'Colour + collection development', 'Craft cluster collaboration'],
    sampleWork: 'Apparel collections, home-textile ranges, craft collaborations.',
  },
  {
    slug: 'animation-film-design',
    name: 'Animation Film Design',
    programme: 'M.Des',
    theme: 'animation',
    summary: '2D, 3D, and stop-motion for film, advertising, and interactive media.',
    whatTheyDo: ['Character + motion', 'Story, script + direction', 'Layout + visual development', 'Compositing + post'],
    sampleWork: 'Short films, ad spots, explainer and title sequences.',
  },
  {
    slug: 'apparel-design',
    name: 'Apparel Design',
    programme: 'M.Des',
    theme: 'textile',
    summary: 'Garment design, pattern, and construction across fashion and functional wear.',
    whatTheyDo: ['Silhouette + garment design', 'Pattern-making + draping', 'Fit, grading + construction', 'Trend + range planning'],
    sampleWork: 'Ready-to-wear lines, functional and protective wear, capsule collections.',
  },
  {
    slug: 'ceramic-glass-design',
    name: 'Ceramic and Glass Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Material-led product and surface design in ceramic and glass.',
    whatTheyDo: ['Form + tableware design', 'Glaze, body + material research', 'Mould-making + casting', 'Architectural surface + tiling'],
    sampleWork: 'Tableware ranges, sanitaryware concepts, architectural cladding, studio objects.',
  },
  {
    slug: 'film-video-communication',
    name: 'Film and Video Communication',
    programme: 'M.Des',
    theme: 'communication',
    summary: 'Live-action film, documentary, and video for communication and advocacy.',
    whatTheyDo: ['Direction + screenwriting', 'Cinematography + editing', 'Documentary + non-fiction', 'Sound + post-production'],
    sampleWork: 'Documentaries, brand films, public-interest and development-sector video.',
  },
  {
    slug: 'furniture-interior-design',
    name: 'Furniture and Interior Design',
    programme: 'M.Des',
    theme: 'furniture',
    summary: 'Spatial design, furniture, and interior product.',
    whatTheyDo: ['Spatial planning + zoning', 'Furniture + product systems', 'Material + joinery detailing', 'Lighting + experience design'],
    sampleWork: 'Retail and workspace interiors, modular furniture systems, hospitality fit-outs.',
  },
  {
    slug: 'graphic-design',
    name: 'Graphic Design',
    programme: 'M.Des',
    theme: 'communication',
    summary: 'Brand, packaging, and print-to-screen visual craft.',
    whatTheyDo: ['Packaging systems', 'Brand collateral + campaigns', 'Print + screen layout', 'Information + wayfinding graphics'],
    sampleWork: 'Packaging ranges, brand guidelines, poster and campaign series.',
  },
  {
    slug: 'information-design',
    name: 'Information Design',
    programme: 'M.Des',
    theme: 'communication',
    summary: 'Making complex data and systems legible through visual structure.',
    whatTheyDo: ['Data + information visualisation', 'Wayfinding + signage systems', 'Diagrammatic + explanatory graphics', 'Content structuring + editorial logic'],
    sampleWork: 'Dashboards, transit wayfinding, public-health and policy explainers, annual reports.',
  },
  {
    slug: 'interaction-design',
    name: 'Interaction Design',
    programme: 'M.Des',
    theme: 'ux',
    summary: 'UX research, interaction patterns, and human-centred systems.',
    whatTheyDo: ['Generative + evaluative research', 'Flows + prototypes', 'Design systems', 'Service blueprints'],
    sampleWork: 'Fintech, health, and public-service product case studies.',
  },
  {
    slug: 'lifestyle-accessory-design',
    name: 'Lifestyle and Accessory Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Jewellery, accessories, and lifestyle products at body and object scale.',
    whatTheyDo: ['Jewellery + accessory design', 'Material + craft exploration', 'Soft goods + leather', 'Trend + lifestyle research'],
    sampleWork: 'Jewellery lines, bags and travel goods, eyewear, desk and lifestyle objects.',
  },
  {
    slug: 'new-media-design',
    name: 'New Media Design',
    programme: 'M.Des',
    theme: 'communication',
    summary: 'Interactive, generative, and screen-based media at the edge of technology and art.',
    whatTheyDo: ['Creative coding + generative media', 'Interactive installations', 'AR / VR + projection', 'Data-driven + sensor-based work'],
    sampleWork: 'Museum installations, interactive exhibits, generative campaigns, immersive experiences.',
  },
  {
    slug: 'photography-design',
    name: 'Photography Design',
    programme: 'M.Des',
    theme: 'communication',
    summary: 'Photographic image-making across commercial, editorial, and documentary practice.',
    whatTheyDo: ['Product + commercial photography', 'Editorial + portraiture', 'Documentary + photo-essay', 'Post-production + colour grading'],
    sampleWork: 'Product catalogues, editorial shoots, documentary photo-essays, brand image banks.',
  },
  {
    slug: 'product-design',
    name: 'Product Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Hardware and software product design, end to end.',
    whatTheyDo: ['Concept → CMF → CAD', 'Hardware + software integration', 'Design for manufacture', 'Sustainability + systems thinking'],
    sampleWork: 'Shipped consumer devices, sustainability-driven product theses.',
  },
  {
    slug: 'strategic-design-management',
    name: 'Strategic Design Management',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Design at the intersection of business strategy, innovation, and systems.',
    whatTheyDo: ['Design strategy + research', 'Business model + innovation', 'Service + organisation design', 'Design operations + roadmapping'],
    sampleWork: 'Innovation roadmaps, service strategy decks, venture and go-to-market design.',
  },
  {
    slug: 'toy-game-design',
    name: 'Toy and Game Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Play, learning, and game systems across physical and tabletop formats.',
    whatTheyDo: ['Toy + play-object design', 'Board + tabletop game systems', 'Learning + educational play', 'Safety + manufacture for play'],
    sampleWork: 'Educational toys, board and card games, play-based learning kits.',
  },
  {
    slug: 'transportation-automobile-design',
    name: 'Transportation and Automobile Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Vehicle exterior, interior, and mobility-system design.',
    whatTheyDo: ['Vehicle exterior + form', 'Interior + HMI design', 'Clay + digital surfacing', 'Future mobility + systems'],
    sampleWork: 'Concept vehicles, interior and HMI studies, two-wheeler and mobility concepts.',
  },
  {
    slug: 'universal-design',
    name: 'Universal Design',
    programme: 'M.Des',
    theme: 'industrial',
    summary: 'Inclusive, accessible design for the full range of human ability.',
    whatTheyDo: ['Accessibility + inclusive research', 'Assistive product design', 'Built-environment + access audits', 'Inclusive systems + policy'],
    sampleWork: 'Assistive devices, accessible public spaces, inclusive product and service redesigns.',
  },
  {
    slug: 'digital-game-design',
    name: 'Digital Game Design',
    programme: 'M.Des',
    theme: 'animation',
    summary: 'Interactive digital games — mechanics, narrative, and real-time art.',
    whatTheyDo: ['Game mechanics + level design', 'Narrative + world-building', 'Real-time art + asset pipelines', 'Prototyping + playtesting'],
    sampleWork: 'Playable game prototypes, narrative and casual games, real-time interactive worlds.',
  },
];

export function disciplineBySlug(slug: string): Discipline | null {
  return DISCIPLINES.find((d) => d.slug === slug) ?? null;
}

/**
 * A start/end span for one cycle activity (plan §D: "Key Dates → Start + End for
 * every activity"). Both are human-readable display strings ('14 Apr 2026'); the
 * `.ics` feed and add-to-calendar controls parse these into dates downstream.
 */
export interface DateSpan {
  readonly start: string;
  readonly end: string;
}

/** The five tracked activities in a cycle, each as a start→end span. */
export interface CycleActivities {
  readonly applications: DateSpan;
  readonly jdDeadline: DateSpan;
  readonly browsing: DateSpan;
  readonly interviewWindow: DateSpan;
  readonly offers: DateSpan;
}

export interface Cycle {
  readonly slug: string;
  readonly label: string;
  readonly status: 'open' | 'upcoming' | 'closed';
  /**
   * Which surface this cycle belongs to (plan §D): the current year's 2 cycles
   * render prominently as 'current'; older cycles fall into the Archive section.
   */
  readonly phase: 'current' | 'archive';
  /** Participation fee, invoiced to the recruiter at intake (plan §4.18). */
  readonly participationFeeRupees: number;
  /**
   * Student-mentor / faculty-guidance fee, per student, collected after a student
   * joins and starts the Graduation Project. Not applicable to full-time hires
   * (plan §D / §4.18).
   */
  readonly gpFeePerStudentRupees: number;
  readonly activities: CycleActivities;
  readonly eligibleDisciplines: readonly string[];
}

const ALL_DISCIPLINE_SLUGS: readonly string[] = DISCIPLINES.map((d) => d.slug);
const PARTICIPATION_FEE_RUPEES = 15_000;
const GP_FEE_PER_STUDENT_RUPEES = 5_000;

/**
 * Two current-year (2026) cycles shown prominently, plus an archive of the last
 * two years (plan §D). The current year runs an autumn and a spring cycle; the
 * archive carries the equivalent cycles for 2025 and 2024.
 */
export const CYCLES: readonly Cycle[] = [
  {
    slug: 'spring-2026',
    label: 'Spring 2026',
    status: 'open',
    phase: 'current',
    participationFeeRupees: PARTICIPATION_FEE_RUPEES,
    gpFeePerStudentRupees: GP_FEE_PER_STUDENT_RUPEES,
    activities: {
      applications: { start: '14 Apr 2026', end: '08 May 2026' },
      jdDeadline: { start: '14 Apr 2026', end: '14 May 2026' },
      browsing: { start: '23 May 2026', end: '31 May 2026' },
      interviewWindow: { start: '01 Jun 2026', end: '05 Jun 2026' },
      offers: { start: '06 Jun 2026', end: '10 Jun 2026' },
    },
    eligibleDisciplines: ALL_DISCIPLINE_SLUGS,
  },
  {
    slug: 'autumn-2026',
    label: 'Autumn 2026',
    status: 'upcoming',
    phase: 'current',
    participationFeeRupees: PARTICIPATION_FEE_RUPEES,
    gpFeePerStudentRupees: GP_FEE_PER_STUDENT_RUPEES,
    activities: {
      applications: { start: '08 Sep 2026', end: '02 Oct 2026' },
      jdDeadline: { start: '08 Sep 2026', end: '09 Oct 2026' },
      browsing: { start: '19 Oct 2026', end: '27 Oct 2026' },
      interviewWindow: { start: '16 Nov 2026', end: '20 Nov 2026' },
      offers: { start: '23 Nov 2026', end: '30 Nov 2026' },
    },
    eligibleDisciplines: ALL_DISCIPLINE_SLUGS,
  },
  {
    slug: 'autumn-2025',
    label: 'Autumn 2025',
    status: 'closed',
    phase: 'archive',
    participationFeeRupees: PARTICIPATION_FEE_RUPEES,
    gpFeePerStudentRupees: GP_FEE_PER_STUDENT_RUPEES,
    activities: {
      applications: { start: '10 Sep 2025', end: '04 Oct 2025' },
      jdDeadline: { start: '10 Sep 2025', end: '12 Oct 2025' },
      browsing: { start: '20 Oct 2025', end: '28 Oct 2025' },
      interviewWindow: { start: '18 Nov 2025', end: '22 Nov 2025' },
      offers: { start: '24 Nov 2025', end: '30 Nov 2025' },
    },
    eligibleDisciplines: ALL_DISCIPLINE_SLUGS,
  },
  {
    slug: 'spring-2025',
    label: 'Spring 2025',
    status: 'closed',
    phase: 'archive',
    participationFeeRupees: PARTICIPATION_FEE_RUPEES,
    gpFeePerStudentRupees: GP_FEE_PER_STUDENT_RUPEES,
    activities: {
      applications: { start: '15 Apr 2025', end: '09 May 2025' },
      jdDeadline: { start: '15 Apr 2025', end: '15 May 2025' },
      browsing: { start: '24 May 2025', end: '01 Jun 2025' },
      interviewWindow: { start: '02 Jun 2025', end: '06 Jun 2025' },
      offers: { start: '07 Jun 2025', end: '11 Jun 2025' },
    },
    eligibleDisciplines: ALL_DISCIPLINE_SLUGS,
  },
  {
    slug: 'autumn-2024',
    label: 'Autumn 2024',
    status: 'closed',
    phase: 'archive',
    participationFeeRupees: PARTICIPATION_FEE_RUPEES,
    gpFeePerStudentRupees: GP_FEE_PER_STUDENT_RUPEES,
    activities: {
      applications: { start: '09 Sep 2024', end: '03 Oct 2024' },
      jdDeadline: { start: '09 Sep 2024', end: '10 Oct 2024' },
      browsing: { start: '21 Oct 2024', end: '29 Oct 2024' },
      interviewWindow: { start: '18 Nov 2024', end: '22 Nov 2024' },
      offers: { start: '25 Nov 2024', end: '29 Nov 2024' },
    },
    eligibleDisciplines: ALL_DISCIPLINE_SLUGS,
  },
  {
    slug: 'spring-2024',
    label: 'Spring 2024',
    status: 'closed',
    phase: 'archive',
    participationFeeRupees: PARTICIPATION_FEE_RUPEES,
    gpFeePerStudentRupees: GP_FEE_PER_STUDENT_RUPEES,
    activities: {
      applications: { start: '15 Apr 2024', end: '09 May 2024' },
      jdDeadline: { start: '15 Apr 2024', end: '15 May 2024' },
      browsing: { start: '24 May 2024', end: '01 Jun 2024' },
      interviewWindow: { start: '03 Jun 2024', end: '07 Jun 2024' },
      offers: { start: '08 Jun 2024', end: '12 Jun 2024' },
    },
    eligibleDisciplines: ALL_DISCIPLINE_SLUGS,
  },
];

/** The current-year cycles (plan §D: shown prominently above the archive). */
export const CURRENT_CYCLES: readonly Cycle[] = CYCLES.filter((c) => c.phase === 'current');

/** The archived cycles from prior years (plan §D: the Archive section). */
export const ARCHIVED_CYCLES: readonly Cycle[] = CYCLES.filter((c) => c.phase === 'archive');

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
