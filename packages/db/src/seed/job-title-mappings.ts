/**
 * Canonical job-title → discipline mappings (Phase 6.10).
 *
 * Initial set covering common recruiter vocabulary. Grows over time as admin
 * promotes AI-proposed mappings via the discipline-mapping admin surface.
 *
 * Confidence is in basis points (10000 = 100%).
 */
export const seedJobTitleMappings = [
  {
    rawTitle: 'visual designer',
    targetDisciplineIdsJson: JSON.stringify(['disc_communication_design', 'disc_graphic_design']),
    source: 'canonical' as const,
    confidence: 9000,
    version: 1,
  },
  {
    rawTitle: 'ux designer',
    targetDisciplineIdsJson: JSON.stringify(['disc_interaction_design', 'disc_information_design']),
    source: 'canonical' as const,
    confidence: 9000,
    version: 1,
  },
  {
    rawTitle: 'ui/ux designer',
    targetDisciplineIdsJson: JSON.stringify([
      'disc_interaction_design',
      'disc_communication_design',
      'disc_information_design',
    ]),
    source: 'canonical' as const,
    confidence: 8500,
    version: 1,
  },
  {
    rawTitle: 'product designer',
    targetDisciplineIdsJson: JSON.stringify([
      'disc_product_design',
      'disc_industrial_design',
      'disc_interaction_design',
    ]),
    source: 'canonical' as const,
    confidence: 8000,
    version: 1,
  },
  {
    rawTitle: 'industrial designer',
    targetDisciplineIdsJson: JSON.stringify([
      'disc_industrial_design',
      'disc_product_design',
      'disc_furniture_interior',
      'disc_transportation',
    ]),
    source: 'canonical' as const,
    confidence: 9000,
    version: 1,
  },
  {
    rawTitle: 'graphic designer',
    targetDisciplineIdsJson: JSON.stringify(['disc_graphic_design', 'disc_communication_design']),
    source: 'canonical' as const,
    confidence: 9500,
    version: 1,
  },
  {
    rawTitle: 'animation artist',
    targetDisciplineIdsJson: JSON.stringify(['disc_animation_film', 'disc_film_video']),
    source: 'canonical' as const,
    confidence: 9000,
    version: 1,
  },
  {
    rawTitle: 'textile designer',
    targetDisciplineIdsJson: JSON.stringify(['disc_textile_design', 'disc_apparel_design']),
    source: 'canonical' as const,
    confidence: 9500,
    version: 1,
  },
  {
    rawTitle: 'brand designer',
    targetDisciplineIdsJson: JSON.stringify(['disc_communication_design', 'disc_graphic_design']),
    source: 'canonical' as const,
    confidence: 8500,
    version: 1,
  },
  {
    rawTitle: 'design researcher',
    targetDisciplineIdsJson: JSON.stringify(['disc_interaction_design', 'disc_strategic_design']),
    source: 'canonical' as const,
    confidence: 8000,
    version: 1,
  },
  {
    rawTitle: 'design strategist',
    targetDisciplineIdsJson: JSON.stringify(['disc_strategic_design', 'disc_interaction_design']),
    source: 'canonical' as const,
    confidence: 8500,
    version: 1,
  },
  {
    rawTitle: 'motion designer',
    targetDisciplineIdsJson: JSON.stringify(['disc_animation_film', 'disc_communication_design']),
    source: 'canonical' as const,
    confidence: 8500,
    version: 1,
  },
];
