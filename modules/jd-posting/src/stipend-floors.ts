import type { RoleType } from '@nid/core';

/**
 * Stipend-floor matrix seed (Phase 5.3). Programme × role-type → floor in paise.
 * Seed data for this slice; moves to per-cycle admin config when the DB lands.
 *
 * Values are illustrative monthly figures for internships and annual figures
 * for full-time, expressed in paise (₹1 = 100 paise).
 */

export type Programme = 'bachelors' | 'masters';

interface FloorKey {
  readonly programme: Programme;
  readonly roleType: RoleType;
}

const FLOOR_TABLE: ReadonlyArray<FloorKey & { floorPaise: number }> = [
  // Full-time (annual CTC floor)
  { programme: 'bachelors', roleType: 'full-time', floorPaise: 4_50_000_00 }, // ₹4.5L
  { programme: 'masters', roleType: 'full-time', floorPaise: 6_00_000_00 }, // ₹6.0L
  // Vacation internship (monthly stipend floor)
  { programme: 'bachelors', roleType: 'vacation-internship', floorPaise: 15_000_00 }, // ₹15k/mo
  { programme: 'masters', roleType: 'vacation-internship', floorPaise: 25_000_00 }, // ₹25k/mo
  // During-course internship (monthly stipend floor, lower — max 20 hrs/week)
  { programme: 'bachelors', roleType: 'during-course-internship', floorPaise: 8_000_00 }, // ₹8k/mo
  { programme: 'masters', roleType: 'during-course-internship', floorPaise: 12_000_00 }, // ₹12k/mo
];

export function floorPaiseFor(programme: Programme, roleType: RoleType): number {
  const row = FLOOR_TABLE.find((r) => r.programme === programme && r.roleType === roleType);
  return row?.floorPaise ?? 0;
}

/**
 * A JD targets disciplines that may span programmes. For the gate we use the
 * STRICTER (higher) of the applicable programme floors, so a JD open to both
 * B.Des and M.Des must clear the M.Des floor.
 */
export function strictestFloorPaise(programmes: readonly Programme[], roleType: RoleType): number {
  if (programmes.length === 0) return floorPaiseFor('masters', roleType);
  return Math.max(...programmes.map((p) => floorPaiseFor(p, roleType)));
}
