import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Button atom — reads only component-tier tokens declared in
 * `packages/ui/tokens/components/button.css`. Component tokens in turn
 * reference semantic tokens; the harness ensures no primitives leak in here.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
}

const baseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--btn-gap)',
  borderRadius: 'var(--btn-radius)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  fontWeight: 'var(--fw-500)',
  fontFamily: 'var(--ff-sans)',
  textDecoration: 'none',
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background-color var(--btn-motion), color var(--btn-motion), box-shadow var(--btn-motion)',
};

function styleFor(variant: ButtonVariant, size: ButtonSize) {
  const sizeStyle =
    size === 'sm'
      ? {
          padding: 'var(--btn-sm-padding-y) var(--btn-sm-padding-x)',
          fontSize: 'var(--btn-sm-font-size)',
        }
      : size === 'lg'
        ? {
            padding: 'var(--btn-lg-padding-y) var(--btn-lg-padding-x)',
            fontSize: 'var(--btn-lg-font-size)',
          }
        : {
            padding: 'var(--btn-padding-y) var(--btn-padding-x)',
            fontSize: 'var(--fs-16)',
          };

  const variantStyle =
    variant === 'primary'
      ? {
          backgroundColor: 'var(--btn-bg-primary)',
          color: 'var(--btn-fg-primary)',
        }
      : variant === 'secondary'
        ? {
            backgroundColor: 'var(--btn-bg-secondary)',
            color: 'var(--btn-fg-secondary)',
            borderColor: 'var(--btn-border-secondary)',
          }
        : {
            backgroundColor: 'var(--btn-bg-ghost)',
            color: 'var(--btn-fg-ghost)',
          };

  return { ...baseStyle, ...sizeStyle, ...variantStyle };
}

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button {...rest} style={{ ...styleFor(variant, size), ...rest.style }}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
