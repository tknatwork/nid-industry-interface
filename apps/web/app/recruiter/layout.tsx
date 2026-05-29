import type { ReactNode } from 'react';

/**
 * Force every recruiter-portal page to render per request. The JSON-backed mock
 * stores mutate at runtime (post a JD, shortlist, issue offers), so a static
 * build-time prerender would serve a stale snapshot on a deployed demo. At demo
 * scale the cost of skipping static optimization here is irrelevant; "alive" wins.
 */
export const dynamic = 'force-dynamic';

export default function RecruiterSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
