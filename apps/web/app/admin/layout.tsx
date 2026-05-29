import type { ReactNode } from 'react';

/**
 * Force every admin-portal page to render per request — the accountability,
 * moderation, and publishing surfaces all read mutable JSON-backed stores, so a
 * static prerender would serve stale data on a deployed demo.
 */
export const dynamic = 'force-dynamic';

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
