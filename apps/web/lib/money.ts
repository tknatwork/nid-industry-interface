/** Paise → display rupees, Indian grouping. Matches the recruiter-side convention. */
export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

/** Compensation summary line for a JD-like comp shape. */
export function compLine(comp: {
  roleType: string;
  baseMinPaise?: number | undefined;
  baseMaxPaise?: number | undefined;
  stipendPaise?: number | undefined;
}): string {
  if (comp.roleType === 'full-time') {
    if (comp.baseMinPaise !== undefined && comp.baseMaxPaise !== undefined) {
      return `${rupees(comp.baseMinPaise)} – ${rupees(comp.baseMaxPaise)} / yr`;
    }
    if (comp.baseMinPaise !== undefined) return `${rupees(comp.baseMinPaise)} / yr`;
    return 'CTC to be confirmed';
  }
  return comp.stipendPaise !== undefined ? `${rupees(comp.stipendPaise)} / mo` : 'stipend to be confirmed';
}
