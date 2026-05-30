import { sql } from 'drizzle-orm';
import { createDb, type Db } from './client';

/**
 * Durable KV layer for demo-state persistence.
 *
 * Each module keeps its synchronous JSON store as the in-instance cache, and
 * mirrors its FULL state blob into a single `kv_store` table row keyed by the
 * store name. That blob survives serverless cold starts and is shared across
 * instances — the fix for the `/tmp`-JSON single-instance caveat that made demo
 * state reset between requests.
 *
 * Everything here is gated on `DATABASE_URL`. With no URL, every function is a
 * no-op and the modules fall back to their JSON files, so the live demo never
 * breaks. The table self-creates on first use, so a fresh hosted Postgres needs
 * no migration — just the connection string.
 *
 * The connection is lazy (created on first use, reused after) and never opened
 * at import time, so importing `@nid/db` is always safe.
 */

let cachedDb: Db | null = null;
let tableEnsured = false;

function getDb(): Db | null {
  const url = process.env['DATABASE_URL'];
  if (!url) return null;
  if (!cachedDb) cachedDb = createDb({ url, max: 3 });
  return cachedDb;
}

/** True when a DATABASE_URL is configured (durable persistence is active). */
export function kvEnabled(): boolean {
  return Boolean(process.env['DATABASE_URL']);
}

async function ensureTable(db: Db): Promise<void> {
  if (tableEnsured) return;
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS kv_store (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  tableEnsured = true;
}

/** Read every stored blob as `{ '<store-key>': <StoreState>, ... }`. */
export async function kvGetAll(): Promise<Record<string, unknown>> {
  const db = getDb();
  if (!db) return {};
  await ensureTable(db);
  // SAFE-CAST: drizzle's execute() returns a generic RowList; this query's
  // shape is fixed by the SELECT column list above.
  const rows = (await db.execute(sql`SELECT key, value FROM kv_store`)) as unknown as ReadonlyArray<{
    key: string;
    value: unknown;
  }>;
  const out: Record<string, unknown> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

/** Upsert one store's full state blob. */
export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = getDb();
  if (!db) return;
  await ensureTable(db);
  const json = JSON.stringify(value);
  await db.execute(
    sql`INSERT INTO kv_store (key, value) VALUES (${key}, ${json}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
  );
}

/**
 * Fire-and-forget durable write-through for the synchronous module stores.
 * Never throws and never blocks the caller: the JSON file is the in-instance
 * source of truth, and because each call writes the FULL blob, a dropped write
 * self-heals on the next persist. No-op without DATABASE_URL.
 */
export function syncKv(key: string, value: unknown): void {
  if (!process.env['DATABASE_URL']) return;
  void kvSet(key, value).catch(() => {
    /* best-effort durable mirror; the JSON file already holds the live state */
  });
}
