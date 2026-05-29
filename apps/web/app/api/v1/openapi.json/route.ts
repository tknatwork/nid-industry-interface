/**
 * Hand-written OpenAPI 3.1 document for the federation API surface (Phase 3.6 /
 * 6.8). Describes the institution-side (per-campus `x-api-key`), recruiter-side
 * (bearer, read-only), and public feeds. Served as a static JSON object.
 */

const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'NID Industry Interface — Federation API',
    version: '1.0.0',
    description:
      'Federation surface for the NID Industry Interface placement portal. ' +
      'Institution-side endpoints are scoped by a per-campus API key; recruiter-side ' +
      'endpoints are bearer-scoped and strictly read-only (counts and aggregates, never ' +
      'student PII); public feeds are unauthenticated. Demo data only.',
  },
  servers: [{ url: '/api', description: 'Same-origin federation mount' }],
  components: {
    securitySchemes: {
      institutionKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Per-campus institution key. Demo keys: nid-inst-ahmedabad-demo, nid-inst-bengaluru-demo, nid-inst-gandhinagar-demo.',
      },
      recruiterBearer: {
        type: 'http',
        scheme: 'bearer',
        description: 'Per-company recruiter token (the issued API key id). Demo active token: key_acme_01.',
      },
    },
  },
  paths: {
    '/public/cycles.json': {
      get: { summary: 'Public JSON feed of recruitment cycles.', security: [] },
    },
    '/public/cycles.ics': {
      get: { summary: 'Public iCalendar (text/calendar) feed of recruitment cycles.', security: [] },
    },
    '/public/recruiters/past.json': {
      get: { summary: 'Public JSON feed of past recruiters (last 5 years).', security: [] },
    },
    '/v1/institution/cycles': {
      get: { summary: 'Recruitment cycles for the keyed campus.', security: [{ institutionKey: [] }] },
    },
    '/v1/institution/disciplines': {
      get: { summary: 'Design-discipline taxonomy for the keyed campus.', security: [{ institutionKey: [] }] },
    },
    '/v1/institution/reports': {
      get: { summary: 'Aggregate placement reports for the keyed campus.', security: [{ institutionKey: [] }] },
    },
    '/v1/institution/coordinators': {
      get: { summary: 'Student coordinators and escalation chain for the keyed campus.', security: [{ institutionKey: [] }] },
    },
    '/v1/institution/recruiters/past': {
      get: { summary: 'Past recruiters for the keyed campus; ?years=N (default 5).', security: [{ institutionKey: [] }] },
    },
    '/v1/institution/announcements': {
      post: { summary: 'Publish a campus announcement (write surface; Zod-validated).', security: [{ institutionKey: [] }] },
    },
    '/v1/recruiter/me': {
      get: { summary: 'Authenticated recruiter identity and health band.', security: [{ recruiterBearer: [] }] },
    },
    '/v1/recruiter/me/jds': {
      get: { summary: "The recruiter's own JD summaries (no student PII).", security: [{ recruiterBearer: [] }] },
    },
    '/v1/recruiter/cycles': {
      get: { summary: 'Recruitment cycles for the authenticated recruiter.', security: [{ recruiterBearer: [] }] },
    },
  },
} as const;

export function GET(): Response {
  return Response.json(openapi, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
