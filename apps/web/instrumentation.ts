/**
 * Cold-start hydration entry. Next.js calls `register()` once per server
 * instance at boot, BEFORE any request is served. The actual hydration touches
 * the filesystem + Postgres, so it lives in a Node-only module that is imported
 * ONLY in the Node.js runtime — Next statically inlines `NEXT_RUNTIME`, so the
 * branch (and its `node:fs` imports) is dead-code-eliminated from the Edge
 * middleware bundle.
 */
export async function register(): Promise<void> {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { hydrateFromKv } = await import('./instrumentation-hydrate');
    await hydrateFromKv();
  }
}
