import type { ReactNode } from 'react';

/**
 * Force every student-portal page to render per request — opt-in, applications,
 * and the offer inbox read mutable JSON-backed stores, so a static prerender
 * would serve stale data on a deployed demo.
 */
export const dynamic = 'force-dynamic';

export default function StudentSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
