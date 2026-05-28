#!/usr/bin/env node
/**
 * Native boundary harness (Phase 9.5) — dependency-free, runs on plain Node.
 *
 * We use this instead of dependency-cruiser because dependency-cruiser cannot
 * resolve `typescript` under pnpm's isolated layout (it falls back to a JS-only
 * parser and dies on TS syntax). This checker reads imports with a tolerant
 * regex — enough for this codebase's clean, single-line import style — and
 * enforces exactly the project's rules:
 *
 *   1. No cross-module internal imports. A file in modules/A may reach modules/B
 *      ONLY through the public package specifier `@nid/module-b` — never a
 *      relative `../b/...` path and never a deep `@nid/module-b/src|internal/...`.
 *   2. packages/core stays pure — no @nid/db, no @nid/module-*, no `next`, no
 *      reaching into apps/.
 *   3. No circular dependencies among @nid/* workspace packages.
 *
 * Exit 0 = clean, 1 = violations (used by CI + the pre-commit hook).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_AREAS = ['apps', 'packages', 'modules'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo', '.dev-data', '.git']);
const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Discover workspace packages: name → absolute dir. */
function discoverPackages() {
  const map = new Map();
  for (const area of ['apps', 'packages', 'modules']) {
    const areaDir = join(ROOT, area);
    let entries = [];
    try {
      entries = readdirSync(areaDir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const pkgJson = join(areaDir, entry, 'package.json');
      try {
        const { name } = JSON.parse(readFileSync(pkgJson, 'utf8'));
        if (name) map.set(name, join(areaDir, entry));
      } catch {
        /* not a package */
      }
    }
  }
  return map;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts|cts)$/.test(entry)) out.push(full);
  }
  return out;
}

function readImports(file) {
  const text = readFileSync(file, 'utf8');
  const specs = [];
  for (const m of text.matchAll(IMPORT_RE)) {
    specs.push(m[1] ?? m[2] ?? m[3]);
  }
  return specs.filter(Boolean);
}

/** Which top-level workspace dir owns a file, e.g. "modules/jd-posting". */
function areaOf(file) {
  const rel = relative(ROOT, file);
  const parts = rel.split('/');
  if (SRC_AREAS.includes(parts[0]) && parts[1]) return `${parts[0]}/${parts[1]}`;
  return null;
}

const packages = discoverPackages();
const violations = [];
// package-name → set of @nid/* package-names it imports (for cycle detection)
const graph = new Map();

for (const [, dir] of packages) {
  for (const file of walk(dir)) {
    const owner = areaOf(file);
    const ownerAbs = owner ? join(ROOT, owner) : null;
    const ownerPkgName = [...packages].find(([, d]) => d === ownerAbs)?.[0];
    if (ownerPkgName && !graph.has(ownerPkgName)) graph.set(ownerPkgName, new Set());

    for (const spec of readImports(file)) {
      const where = `${relative(ROOT, file)} → '${spec}'`;

      // Rule 1a: relative imports must not escape the owning package.
      if (spec.startsWith('.')) {
        const target = resolve(dirname(file), spec);
        if (ownerAbs && !target.startsWith(ownerAbs + '/') && !target.startsWith(ownerAbs)) {
          // escaped this package via a relative path
          if (!target.startsWith(ownerAbs)) {
            violations.push(`[cross-package-relative] ${where} resolves outside ${owner}`);
          }
        }
        continue;
      }

      // Record @nid/* edges for cycle detection.
      const nidMatch = spec.match(/^(@nid\/[^/]+)/);
      if (nidMatch && ownerPkgName && packages.has(nidMatch[1]) && nidMatch[1] !== ownerPkgName) {
        graph.get(ownerPkgName).add(nidMatch[1]);
      }

      // Rule 1b: no deep imports past a module/package public entry.
      if (/^@nid\/module-[^/]+\/(src|internal)\//.test(spec) || /^@nid\/(core|ui|db)\/src\//.test(spec)) {
        violations.push(`[deep-import] ${where} bypasses the package's public index`);
      }

      // Rule 2: core purity.
      if (owner === 'packages/core') {
        if (/^@nid\/(db|module-)/.test(spec) || spec === 'next' || spec.startsWith('next/')) {
          violations.push(`[core-impurity] ${where} — core must stay pure (no db/modules/next)`);
        }
      }
    }
  }
}

// Rule 3: cycle detection over the @nid/* package graph (DFS).
function findCycle() {
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const color = new Map([...graph.keys()].map((k) => [k, WHITE]));
  const stack = [];
  let cycle = null;
  const visit = (node) => {
    color.set(node, GREY);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (!color.has(next)) continue;
      if (color.get(next) === GREY) {
        cycle = [...stack.slice(stack.indexOf(next)), next];
        return true;
      }
      if (color.get(next) === WHITE && visit(next)) return true;
    }
    stack.pop();
    color.set(node, BLACK);
    return false;
  };
  for (const node of graph.keys()) {
    if (color.get(node) === WHITE && visit(node)) break;
  }
  return cycle;
}

const cycle = findCycle();
if (cycle) violations.push(`[circular] ${cycle.join(' → ')}`);

if (violations.length > 0) {
  console.error(`\n✖ Boundary check failed (${violations.length}):\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ Boundary check passed — ${packages.size} workspace packages, no violations.`);
