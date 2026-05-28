/**
 * Canonical skill taxonomy for the JD multi-select (Phase 6.10).
 *
 * Seed data for this slice. Moves to an admin-editable table when the DB lands.
 * Grouped so the form can show them under headings. The `slug` is the stable
 * identifier stored on the JD; the `label` is display-only.
 */

export interface CanonicalSkill {
  readonly slug: string;
  readonly label: string;
  readonly group: SkillGroup;
}

export type SkillGroup =
  | 'research'
  | 'craft'
  | 'systems'
  | 'tools'
  | 'engineering'
  | 'leadership';

export const SKILL_GROUPS: ReadonlyArray<{ key: SkillGroup; label: string }> = [
  { key: 'research', label: 'Research & strategy' },
  { key: 'craft', label: 'Design craft' },
  { key: 'systems', label: 'Systems & process' },
  { key: 'tools', label: 'Tools' },
  { key: 'engineering', label: 'Engineering (flag for scope review)' },
  { key: 'leadership', label: 'Leadership' },
];

export const CANONICAL_SKILLS: readonly CanonicalSkill[] = [
  // Research & strategy
  { slug: 'user-research', label: 'User research', group: 'research' },
  { slug: 'design-strategy', label: 'Design strategy', group: 'research' },
  { slug: 'usability-testing', label: 'Usability testing', group: 'research' },
  { slug: 'service-design', label: 'Service design', group: 'research' },

  // Design craft
  { slug: 'visual-design', label: 'Visual design', group: 'craft' },
  { slug: 'typography', label: 'Typography', group: 'craft' },
  { slug: 'illustration', label: 'Illustration', group: 'craft' },
  { slug: 'motion-design', label: 'Motion design', group: 'craft' },
  { slug: 'industrial-form', label: 'Industrial form-giving', group: 'craft' },
  { slug: 'textile-surface', label: 'Textile / surface design', group: 'craft' },
  { slug: 'photography', label: 'Photography', group: 'craft' },

  // Systems & process
  { slug: 'design-systems', label: 'Design systems', group: 'systems' },
  { slug: 'interaction-design', label: 'Interaction design', group: 'systems' },
  { slug: 'information-architecture', label: 'Information architecture', group: 'systems' },
  { slug: 'accessibility', label: 'Accessibility (WCAG)', group: 'systems' },
  { slug: 'prototyping', label: 'Prototyping', group: 'systems' },

  // Tools
  { slug: 'figma', label: 'Figma', group: 'tools' },
  { slug: 'adobe-cc', label: 'Adobe Creative Cloud', group: 'tools' },
  { slug: 'cad', label: 'CAD / 3D modelling', group: 'tools' },
  { slug: 'blender', label: 'Blender / 3D', group: 'tools' },

  // Engineering (these trigger scope-review when bundled with a pure-design title)
  { slug: 'html-css', label: 'HTML / CSS', group: 'engineering' },
  { slug: 'javascript', label: 'JavaScript', group: 'engineering' },
  { slug: 'react', label: 'React / frontend frameworks', group: 'engineering' },

  // Leadership
  { slug: 'team-leadership', label: 'Team leadership', group: 'leadership' },
  { slug: 'stakeholder-mgmt', label: 'Stakeholder management', group: 'leadership' },
];

const SKILL_BY_SLUG = new Map(CANONICAL_SKILLS.map((s) => [s.slug, s]));

export function isCanonicalSkill(slug: string): boolean {
  return SKILL_BY_SLUG.has(slug);
}

export function skillLabel(slug: string): string {
  return SKILL_BY_SLUG.get(slug)?.label ?? slug;
}

/**
 * Engineering-group skills bundled into a pure-design role are the canonical
 * "scope creep" signal (Phase 4.2). The deterministic gate can flag these even
 * before the ML analyzer lands.
 */
export function engineeringSkillSlugs(): readonly string[] {
  return CANONICAL_SKILLS.filter((s) => s.group === 'engineering').map((s) => s.slug);
}
