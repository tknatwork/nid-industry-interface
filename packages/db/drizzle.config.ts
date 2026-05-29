import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://nid:nid@localhost:5432/nid_industry_interface',
  },
  strict: true,
  verbose: true,
} satisfies Config;
