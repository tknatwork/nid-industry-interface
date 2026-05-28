// @nid/ui — design system entrypoint.
//
// Token CSS files are imported directly from ./tokens/*.css; React atoms
// are exported here.

export const UI_PACKAGE_NAME = '@nid/ui';

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './atoms/Button';
export { StatusPill, type StatusPillProps, type StatusTone } from './atoms/StatusPill';
export { Field, type FieldProps } from './atoms/Field';
export { PageShell, type PageShellProps } from './atoms/PageShell';
export { AdminShell, type AdminShellProps, type AdminNav } from './atoms/AdminShell';
export {
  RecruiterShell,
  type RecruiterShellProps,
  type RecruiterNav,
} from './atoms/RecruiterShell';
export {
  StudentShell,
  type StudentShellProps,
  type StudentNav,
} from './atoms/StudentShell';
