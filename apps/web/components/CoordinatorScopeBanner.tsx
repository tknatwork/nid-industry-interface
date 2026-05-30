/**
 * CoordinatorScopeBanner — a persistent reminder, on every coordinator-scoped
 * surface, that the student coordinator sees ONLY their assigned companies
 * (plan §Q: deny everything else). Reassures the placement cell that the RBAC
 * subset is in force and explains why other companies aren't listed.
 *
 * Server-renderable (no interactivity). Tokens only.
 */
export interface CoordinatorScopeBannerProps {
  readonly coordinatorName: string;
  readonly campus: string;
  readonly companyCount: number;
}

export function CoordinatorScopeBanner({ coordinatorName, campus, companyCount }: CoordinatorScopeBannerProps) {
  const companies = companyCount === 1 ? '1 assigned company' : `${companyCount} assigned companies`;
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        backgroundColor: 'var(--surface-panel)',
        border: '1px solid var(--border-default)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: 'var(--fs-13)',
        color: 'var(--text-secondary)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--fs-11)',
          fontWeight: 'var(--fw-700)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--accent)',
        }}
      >
        Scoped view
      </span>
      <span>
        {coordinatorName} · NID {campus}. You can see and update {companies} only — every other
        recruiter on the cycle is hidden by your coordinator role.
      </span>
    </div>
  );
}
