import { floorPaiseFor, type Programme } from '@nid/module-jd-posting';
import type { RoleType } from '@nid/core';
import { rupees } from '~/lib/money';

/**
 * Minimum-stipend calculator (Phase 4.15). Server component, form-GET driven —
 * no client JS. The formula is published + deterministic so a recruiter can
 * self-check before posting: cycle floor (from the real matrix) × scope
 * multiplier (design+dev bundle = ×1.4). Recommended = adjusted × 1.4 (75th pct,
 * illustrative). `basePath` is the route the form submits back to.
 */

const ROLE_TYPES: ReadonlyArray<{ value: RoleType; label: string }> = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'vacation-internship', label: 'Vacation internship' },
  { value: 'during-course-internship', label: 'During-course internship' },
];

export interface CalcSelection {
  readonly roleType?: string;
  readonly programme?: string;
  readonly dev?: string;
}

export function StipendCalculator({ basePath, selection }: { basePath: string; selection: CalcSelection }) {
  const roleType = (ROLE_TYPES.find((r) => r.value === selection.roleType)?.value ?? 'full-time') as RoleType;
  const programme = (selection.programme === 'bachelors' ? 'bachelors' : 'masters') as Programme;
  const hasDev = selection.dev === 'on';
  const submitted = selection.roleType !== undefined;

  const cycleFloor = floorPaiseFor(programme, roleType);
  const multiplier = hasDev ? 1.4 : 1;
  const adjusted = Math.round(cycleFloor * multiplier);
  const recommended = Math.round(adjusted * 1.4);
  const unit = roleType === 'full-time' ? '/ yr' : '/ mo';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-8)' }}>
      <form method="get" action={basePath} style={card}>
        <h2 style={{ ...label, marginBottom: 'var(--space-3)' }}>Inputs</h2>

        <label style={field}>
          <span style={fieldLabel}>Role type</span>
          <select name="roleType" defaultValue={roleType} style={input}>
            {ROLE_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>

        <label style={field}>
          <span style={fieldLabel}>Programme</span>
          <select name="programme" defaultValue={programme} style={input}>
            <option value="masters">M.Des</option>
            <option value="bachelors">B.Des</option>
          </select>
        </label>

        <label style={{ ...field, display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input type="checkbox" name="dev" defaultChecked={hasDev} />
          <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>Role also demands engineering / dev work (HTML/CSS/JS, frontend)</span>
        </label>

        <div style={{ marginTop: 'var(--space-4)' }}>
          <button type="submit" style={btn}>Calculate</button>
        </div>
      </form>

      <div style={card}>
        <h2 style={{ ...label, marginBottom: 'var(--space-3)' }}>Estimate</h2>
        {!submitted ? (
          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>Pick inputs and calculate to see the published floor.</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <Row k="Cycle floor (admin-set)" v={`${rupees(cycleFloor)} ${unit}`} />
            <Row k="Scope multiplier" v={`×${multiplier}${hasDev ? ' (design + dev)' : ''}`} />
            <Row k="Calculated minimum" v={`${rupees(adjusted)} ${unit}`} strong />
            <Row k="Recommended (75th pct)" v={`${rupees(recommended)} ${unit}`} />
            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              The formula is published — no black-box rejection. A JD below the calculated minimum is blocked at submission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', fontSize: 'var(--fs-14)', padding: 'var(--space-1) 0' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
      <span style={{ color: 'var(--text-strong)', fontWeight: strong ? 'var(--fw-600)' : 'var(--fw-500)', fontSize: strong ? 'var(--fs-18)' : 'var(--fs-14)' }}>{v}</span>
    </div>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const field = { display: 'block', marginBottom: 'var(--space-3)' } as const;
const fieldLabel = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
const btn = { backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', cursor: 'pointer' } as const;
