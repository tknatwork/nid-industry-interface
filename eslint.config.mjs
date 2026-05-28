// Lean root ESLint flat config (Phase 9.5). Scoped to the workspace modules +
// packages (apps/web keeps `next lint`). Two rules that tsconfig strict can't
// express: ban explicit `any` at the API surface, and keep type imports honest.
// Type-aware linting is deliberately OFF (no `project`) — these rules are
// syntactic, so lint stays fast and needs no per-package tsconfig wiring.
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.dev-data/**',
      'apps/web/**',
    ],
  },
  {
    files: ['modules/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  },
];
