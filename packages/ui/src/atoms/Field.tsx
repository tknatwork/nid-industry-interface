import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Field — accessible form field with label, helper text, and error slot.
 * Wraps a native input. Reads only the input component tokens.
 */

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly id: string;
  readonly label: ReactNode;
  readonly help?: ReactNode;
  readonly error?: ReactNode;
  readonly trailing?: ReactNode;
  /**
   * Marks the field as required: renders a red `*` after the label and sets
   * the native `required` attribute (unless the caller overrides it).
   */
  readonly required?: boolean;
  /**
   * When the field is NOT required and this flag is set, render a muted
   * "(optional)" hint after the label. Off by default so existing fields are
   * unchanged; callers (or an app-level flag) opt in per form.
   */
  readonly showOptionalHint?: boolean;
}

const labelStyle = {
  display: 'block',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const requiredMarkStyle = {
  marginLeft: 'var(--space-1)',
  color: 'var(--input-error-text)',
  fontWeight: 'var(--fw-600)',
};

const optionalHintStyle = {
  marginLeft: 'var(--space-1)',
  color: 'var(--text-secondary)',
  fontWeight: 'var(--fw-400)',
  textTransform: 'none' as const,
  letterSpacing: 'normal',
};

const inputStyle = {
  width: '100%',
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--input-font-size)',
  fontFamily: 'var(--ff-sans)',
  fontWeight: 'var(--fw-400)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
  outline: 'none',
  transition: 'border-color var(--input-motion), box-shadow var(--input-motion)',
};

const helpStyle = {
  marginTop: 'var(--space-1)',
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
};

const errorStyle = {
  marginTop: 'var(--space-1)',
  fontSize: 'var(--fs-12)',
  color: 'var(--input-error-text)',
  fontWeight: 'var(--fw-600)',
};

export function Field({
  id,
  label,
  help,
  error,
  trailing,
  required = false,
  showOptionalHint = false,
  ...inputProps
}: FieldProps) {
  const hasError = Boolean(error);
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const requiredAttr = required;

  return (
    <div style={{ display: 'block' }}>
      <label htmlFor={id} style={labelStyle}>
        {label}
        {required ? (
          <span aria-hidden="true" style={requiredMarkStyle}>
            *
          </span>
        ) : showOptionalHint ? (
          <span style={optionalHintStyle}>(optional)</span>
        ) : null}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          {...inputProps}
          required={requiredAttr}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          style={{
            ...inputStyle,
            ...(hasError
              ? { borderColor: 'var(--input-error-border)' }
              : {}),
            ...inputProps.style,
          }}
        />
        {trailing && (
          <span
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          >
            {trailing}
          </span>
        )}
      </div>
      {help && !hasError && (
        <p id={`${id}-help`} style={helpStyle}>
          {help}
        </p>
      )}
      {hasError && (
        <p id={`${id}-error`} role="alert" style={errorStyle}>
          {error}
        </p>
      )}
    </div>
  );
}
