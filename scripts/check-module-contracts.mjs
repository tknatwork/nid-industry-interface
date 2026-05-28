#!/usr/bin/env node
/**
 * Module-contract presence harness (Phase 9.5, rule 7).
 *
 * Every directory under modules/ must carry the 5-markdown LLM-agnostic context
 * contract, hand-written and non-empty (template stubs are explicitly disallowed
 * — they leak placeholder values). This check is intentionally shallow: it
 * guarantees the files EXIST and have content, not that they are correct. Exit 1
 * on any missing/empty file.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES_DIR = join(ROOT, 'modules');
const REQUIRED = ['CLAUDE.md', 'AGENTS.md', 'CONTEXT.md', 'REFERENCES.md', 'SKILLS.md'];
const MIN_BYTES = 80; // a real contract is well over this; catches empty stubs

const problems = [];
let moduleCount = 0;

for (const entry of readdirSync(MODULES_DIR)) {
  const moduleDir = join(MODULES_DIR, entry);
  if (!statSync(moduleDir).isDirectory()) continue;
  moduleCount += 1;
  for (const file of REQUIRED) {
    const path = join(moduleDir, file);
    try {
      const text = readFileSync(path, 'utf8');
      if (text.trim().length < MIN_BYTES) {
        problems.push(`modules/${entry}/${file} is too short to be a real contract (${text.trim().length} bytes)`);
      }
    } catch {
      problems.push(`modules/${entry}/${file} is missing`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\n✖ Module-contract check failed (${problems.length}):\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ Module-contract check passed — ${moduleCount} modules, all 5 markdowns present.`);
