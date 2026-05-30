import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { kvGetAll } from '@nid/db';

/**
 * Node-only cold-start hydration: durable Postgres KV → the `/tmp` JSON cache
 * the synchronous module stores read from. Imported only from the Node.js
 * branch of `instrumentation.register()`.
 *
 * Fully gated on DATABASE_URL: with no URL this is a no-op and the modules fall
 * back to their JSON seed (the live demo never breaks). Best-effort — any
 * failure falls through to the seed; it must never crash server boot.
 */
export async function hydrateFromKv(): Promise<void> {
  if (!process.env['DATABASE_URL']) return;
  try {
    const dir = process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data');
    const all = await kvGetAll();
    const keys = Object.keys(all);
    if (keys.length === 0) return; // nothing durable yet — modules seed themselves
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    for (const key of keys) {
      writeFileSync(join(dir, `${key}.json`), JSON.stringify(all[key], null, 2), 'utf8');
    }
  } catch {
    // Hydration is best-effort; on any failure the modules fall back to their
    // JSON seed. Never let instrumentation crash the server boot.
  }
}
