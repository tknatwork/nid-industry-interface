/**
 * Seed runner. Run via: `pnpm --filter @nid/db run seed`
 * Requires DATABASE_URL set in env.
 */

import { createDb } from '../client';
import { campuses } from '../schema/campuses';
import { disciplines, jobTitleMappings } from '../schema/disciplines';
import { cycles } from '../schema/cycles';
import { seedCampuses, seedDisciplines, seedJobTitleMappings, seedCycles } from './index';

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is required to run the seed.');
    process.exit(1);
  }

  const db = createDb({ url });

  console.log('Seeding campuses (3 legacy DPIIT campuses)...');
  await db.insert(campuses).values(seedCampuses).onConflictDoNothing();

  console.log(`Seeding disciplines (${seedDisciplines.length} entries)...`);
  await db.insert(disciplines).values(seedDisciplines).onConflictDoNothing();

  console.log(`Seeding job-title mappings (${seedJobTitleMappings.length} canonical entries)...`);
  await db.insert(jobTitleMappings).values(seedJobTitleMappings).onConflictDoNothing();

  console.log('Seeding cycle (Spring 2026)...');
  await db.insert(cycles).values(seedCycles).onConflictDoNothing();

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
