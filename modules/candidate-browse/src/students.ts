import type { CandidateView } from './types';

/**
 * Mock student seed across disciplines so discipline-filtering is demonstrable.
 * When the DB + portfolio.nid.edu ingest land, students come from the DB and
 * portfolios from the ingest pipeline. Shape aligns with @nid/core Student.
 *
 * `optedInCycles` gates visibility — a student is only browsable for a cycle
 * they opted into (Phase 2 principle: student opt-in).
 */

export interface SeedStudent extends CandidateView {
  readonly optedInCycles: readonly string[];
}

const SPRING = 'cycle_spring_2026';

export const SEED_STUDENTS: readonly SeedStudent[] = [
  // Interaction Design (eligible for the Product Designer JD)
  s('stu_0001', 'Riya Mishra', 'disc_interaction_design', 'Interaction Design', 'cyan', 'masters', 2025, 4, 'behance.net', 'UX researcher turned systems designer. Portfolio spans fintech + health.'),
  s('stu_0002', 'Arnav Kulkarni', 'disc_interaction_design', 'Interaction Design', 'cyan', 'masters', 2025, 4, 'behance.net', 'Interaction designer focused on accessible public-service tools.'),
  s('stu_0003', 'Meher Singh', 'disc_interaction_design', 'Interaction Design', 'cyan', 'masters', 2024, 4, 'issuu.com', 'Prototyping-heavy practice; loves motion + micro-interaction.'),
  s('stu_0004', 'Kabir Das', 'disc_interaction_design', 'Interaction Design', 'cyan', 'masters', 2025, 4, 'kabir.design'),

  // Product Design (eligible for the Product Designer JD)
  s('stu_0005', 'Aanya Roy', 'disc_product_design', 'Product Design', 'navy', 'masters', 2025, 4, 'behance.net', 'Hardware + software product designer. Shipped two consumer devices.'),
  s('stu_0006', 'Vikram Nair', 'disc_product_design', 'Product Design', 'navy', 'masters', 2024, 4, 'behance.net', 'Sustainability-driven product design; circular-economy thesis.'),
  s('stu_0007', 'Sara Pillai', 'disc_product_design', 'Product Design', 'navy', 'masters', 2025, 4, 'sarapillai.studio'),

  // A product-design student who did NOT opt into the cycle (proves the opt-in gate)
  { ...s('stu_0008', 'Dev Menon', 'disc_product_design', 'Product Design', 'navy', 'masters', 2025, 4, 'behance.net', 'On exchange this semester; not participating.'), optedInCycles: [] },

  // Communication Design (NOT eligible for the Product Designer JD — proves filtering)
  s('stu_0009', 'Isha Verma', 'disc_communication_design', 'Communication Design', 'red', 'bachelors', 2026, 8, 'behance.net', 'Editorial + brand systems.'),
  s('stu_0010', 'Rohan Gupta', 'disc_communication_design', 'Communication Design', 'red', 'bachelors', 2026, 8, 'issuu.com', 'Type design + publication.'),

  // Graphic Design (NOT eligible — proves filtering)
  s('stu_0011', 'Nila Iyer', 'disc_graphic_design', 'Graphic Design', 'red', 'masters', 2025, 4, 'behance.net', 'Brand + packaging.'),
  s('stu_0012', 'Tara Joshi', 'disc_graphic_design', 'Graphic Design', 'red', 'masters', 2024, 4, 'tarajoshi.com'),

  // Animation (NOT eligible — proves filtering)
  s('stu_0013', 'Imran Sheikh', 'disc_animation_film', 'Animation Film Design', 'yellow', 'masters', 2025, 4, 'vimeo.com', '2D character animation + short film.'),
  s('stu_0014', 'Priya Rao', 'disc_animation_film', 'Animation Film Design', 'yellow', 'masters', 2025, 4, 'behance.net'),
];

function s(
  studentId: string,
  name: string,
  disciplineId: string,
  disciplineName: string,
  accent: CandidateView['accent'],
  programme: CandidateView['programme'],
  batchYear: number,
  semester: number,
  portfolioHost: string,
  statementOfIntent?: string,
): SeedStudent {
  return {
    studentId,
    name,
    disciplineId,
    disciplineName,
    accent,
    programme,
    batchYear,
    semester,
    portfolioUrl: `https://${portfolioHost}/${studentId}`,
    portfolioHost,
    cvAvailable: true,
    ...(statementOfIntent ? { statementOfIntent } : {}),
    optedInCycles: [SPRING],
  };
}
