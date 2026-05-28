/**
 * Minimal disciplines reference for the admin discipline-mapping picker.
 *
 * Mirrors the id/name/slug of the @nid/db seed (packages/db/src/seed/disciplines.ts).
 * Kept here as plain reference data so the admin moderation surface can run on
 * mock data without a DB connection. When the DB lands, both the wizard and the
 * admin surface read the discipline taxonomy from the DB instead, and this file
 * is deleted. Do not let this drift from the db seed in the meantime.
 */

export interface DisciplineRef {
  readonly id: string;
  readonly name: string;
  readonly programme: 'bachelors' | 'masters' | 'both';
}

export const DISCIPLINES_REF: readonly DisciplineRef[] = [
  { id: 'disc_industrial_design', name: 'Industrial Design', programme: 'bachelors' },
  { id: 'disc_communication_design', name: 'Communication Design', programme: 'bachelors' },
  { id: 'disc_textile_design', name: 'Textile Design', programme: 'both' },
  { id: 'disc_animation_film', name: 'Animation Film Design', programme: 'masters' },
  { id: 'disc_apparel_design', name: 'Apparel Design', programme: 'masters' },
  { id: 'disc_ceramic_glass', name: 'Ceramic and Glass Design', programme: 'masters' },
  { id: 'disc_film_video', name: 'Film and Video Communication', programme: 'masters' },
  { id: 'disc_furniture_interior', name: 'Furniture and Interior Design', programme: 'masters' },
  { id: 'disc_graphic_design', name: 'Graphic Design', programme: 'masters' },
  { id: 'disc_information_design', name: 'Information Design', programme: 'masters' },
  { id: 'disc_interaction_design', name: 'Interaction Design', programme: 'masters' },
  { id: 'disc_lifestyle_accessory', name: 'Lifestyle and Accessory Design', programme: 'masters' },
  { id: 'disc_new_media', name: 'New Media Design', programme: 'masters' },
  { id: 'disc_photography_design', name: 'Photography Design', programme: 'masters' },
  { id: 'disc_product_design', name: 'Product Design', programme: 'masters' },
  { id: 'disc_strategic_design', name: 'Strategic Design Management', programme: 'masters' },
  { id: 'disc_toy_game', name: 'Toy and Game Design', programme: 'masters' },
  { id: 'disc_transportation', name: 'Transportation and Automobile Design', programme: 'masters' },
  { id: 'disc_universal_design', name: 'Universal Design', programme: 'masters' },
  { id: 'disc_digital_game', name: 'Digital Game Design', programme: 'masters' },
];

const BY_ID = new Map(DISCIPLINES_REF.map((d) => [d.id, d]));

export function disciplineName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}
