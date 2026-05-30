// @nid/ui — design system entrypoint.
//
// Token CSS files are imported directly from ./tokens/*.css; React atoms
// are exported here.

export const UI_PACKAGE_NAME = '@nid/ui';

export { Logo, type LogoProps } from './atoms/Logo';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './atoms/Button';
export { StatusPill, type StatusPillProps, type StatusTone } from './atoms/StatusPill';
export { Field, type FieldProps } from './atoms/Field';
export { PageShell, type PageShellProps } from './atoms/PageShell';
export { AdminShell, type AdminShellProps, type AdminNav, type AdminRole } from './atoms/AdminShell';
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
export { Overlay, type OverlayProps } from './atoms/Overlay';
export {
  Accordion,
  type AccordionProps,
  type AccordionItem,
} from './atoms/Accordion';
export {
  Tabs,
  type TabsProps,
  type TabItem,
  type TabsVariant,
} from './atoms/Tabs';
export {
  Marquee,
  type MarqueeProps,
  type MarqueeDirection,
} from './atoms/Marquee';
export {
  SidePanel,
  type SidePanelProps,
  type SidePanelSection,
  type SidePanelOption,
} from './atoms/SidePanel';
export {
  ProgressTracker,
  type ProgressTrackerProps,
  type ProgressStep,
  type ProgressTrackerOrientation,
} from './atoms/ProgressTracker';
export { VoiceInput, type VoiceInputProps } from './atoms/VoiceInput';
