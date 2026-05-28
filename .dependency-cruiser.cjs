/**
 * Dependency boundary rules (Phase 9.5 native harness).
 *
 * Enforces:
 * - Components reference semantic tokens only (not primitives) via the CSS
 *   import policy in the harness CI (separate check).
 * - packages/core has no I/O — no @nid/db, no @nid/adapters, no `next`.
 * - packages/adapters depend on core, not on the web app.
 * - apps/web may import packages/* but not /modules/*/internal.
 */
module.exports = {
  forbidden: [
    {
      name: 'core-must-be-pure',
      severity: 'error',
      comment:
        'packages/core is the pure domain layer. It must not depend on side-effect packages (db, web, adapters).',
      from: { path: '^packages/core' },
      to: { path: '^(packages/db|apps/web|packages/adapters)' },
    },
    {
      name: 'adapters-no-web',
      severity: 'error',
      comment: 'packages/adapters must not depend on the web app.',
      from: { path: '^packages/adapters' },
      to: { path: '^apps/web' },
    },
    {
      name: 'no-internal-cross-module-import',
      severity: 'error',
      comment: 'Modules expose a public index.ts only. Cross-module imports from internal/ are forbidden.',
      from: { path: '^modules/([^/]+)' },
      to: { path: '^modules/(?!$1/)([^/]+)/internal' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependency detected.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-npx-banned-tools',
      severity: 'error',
      comment: 'Do not introduce `npx` in shell scripts; use `pnpm exec` or `pnpm dlx`.',
      from: {},
      to: { path: 'node_modules/\\.bin/.*npx' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node'] },
    reporterOptions: { dot: { theme: { graph: { rankdir: 'TD' } } } },
  },
};
