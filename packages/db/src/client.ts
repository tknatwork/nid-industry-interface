import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

export interface DbConfig {
  readonly url: string;
  readonly max?: number; // connection pool size
}

export function createDb(config: DbConfig) {
  const client = postgres(config.url, {
    max: config.max ?? 10,
    onnotice: () => {}, // suppress postgres notices in app logs
  });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
