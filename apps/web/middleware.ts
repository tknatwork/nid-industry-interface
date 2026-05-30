import { NextResponse, type NextRequest } from 'next/server';
import { isCoordinator } from '~/lib/demo-coordinator';

/**
 * Demo RBAC route guard (Round 2 §Q — "any shared /admin surface filters
 * strictly to the coordinator's assigned companies; deny others").
 *
 * The student-coordinator is the first scoped /admin role. Its pages
 * (`/admin/coordinator/*`) already scope their DATA to the coordinator's
 * assigned companies, but the reduced nav only HID the other /admin links — the
 * full-placement-cell routes (`/admin/jds`, `/admin/blacklist`,
 * `/admin/recruiters/*`, …) stayed reachable by typing the URL, which would
 * leak recruiter contact details and cross-company data the coordinator must
 * not see. This middleware closes the whole surface in one place: when the demo
 * actor is the coordinator, every /admin route outside /admin/coordinator is
 * redirected back into the coordinator area.
 *
 * A Server Component layout can't read the request path, so this enforcement
 * lives in middleware. In the default demo (full-admin) it is a no-op. When
 * real auth lands, swap the env check for the verified session role — the
 * matcher and redirect stay the same.
 */
export function middleware(req: NextRequest): NextResponse {
  // Reuse the single role source of truth (resolveAdminRole/isCoordinator) so
  // middleware and the page-level scope checks can't drift. demo-coordinator.ts
  // only reads process.env — no server-only imports — so it is safe in the
  // middleware bundle.
  if (!isCoordinator()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (pathname === '/admin/coordinator' || pathname.startsWith('/admin/coordinator/')) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/coordinator';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Only guard the /admin surface — public, recruiter, and student routes are
  // untouched (recruiter-route gating remains a deferred follow-up per the plan).
  matcher: ['/admin/:path*'],
};
