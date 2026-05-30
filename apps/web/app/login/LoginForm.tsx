'use client';

import { useActionState, useState } from 'react';
import { Button, Field, Overlay, Accordion } from '@nid/ui';
import { FAQ } from '~/lib/recruiter-public';
import { loginAction } from './actions';
import { DEMO_LOGIN, DEMO_LOGINS } from './credentials';
import { initialLoginState, type LoginFormState } from './state';

/**
 * The branch the picker starts on: the Bengaluru primary that the form has
 * always prefilled ({@link DEMO_LOGIN}), matched by username so it stays in sync
 * if the array order changes. Falls back to {@link DEMO_LOGIN} itself — a
 * guaranteed-defined object of the same shape — so the seed is never
 * `undefined` under `noUncheckedIndexedAccess`.
 */
const DEFAULT_LOGIN =
  DEMO_LOGINS.find((login) => login.username === DEMO_LOGIN.username) ??
  DEMO_LOGIN;

/**
 * Recruiter login form (plan §H). Mirrors the live II `login.aspx`: a username +
 * password pair, a "Forgot password" link, and the Sponsorship-Guidelines FAQ
 * inline beneath the form so the recruiter understands what login unlocks and
 * what happens if they're stuck.
 *
 * Differences from the legacy page, by design: the fields are prefilled with the
 * demo credentials (no real auth), "Forgot password" opens an in-page Overlay
 * explainer (the legacy page navigates to a separate `.aspx` that just says
 * "credentials are provided by NID after sign-up"), and the FAQ is a real
 * expand/collapse Accordion reusing the canonical `FAQ` data rather than a
 * static accordion of hardcoded markup.
 *
 * Client component: holds the forgot-password overlay open/close state and
 * threads the login server action through `useActionState`.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(
    loginAction,
    initialLoginState,
  );
  const [forgotOpen, setForgotOpen] = useState(false);

  // Acme Design Studio runs two branches, each a SEPARATE recruiter account with
  // its own corporate email + dashboard (plan Round 3 §D). The fields are
  // controlled so the branch picker can prefill them, while the recruiter can
  // still hand-edit. The current `username` decides which branch button reads as
  // active; a manual edit away from every seeded branch deselects all buttons.
  const [username, setUsername] = useState(DEFAULT_LOGIN.username);
  const [password, setPassword] = useState(DEFAULT_LOGIN.password);

  /** Prefill both fields with a branch's credentials when its button is pressed. */
  function chooseBranch(login: (typeof DEMO_LOGINS)[number]): void {
    setUsername(login.username);
    setPassword(login.password);
  }

  // The branch the typed username currently resolves to, if any. Drives the
  // active button highlight and the "Signing in as …" hint; `undefined` once the
  // recruiter hand-edits the email away from every seeded branch.
  const selectedBranch = DEMO_LOGINS.find((login) => login.username === username);

  return (
    <>
      {DEMO_LOGINS.length > 1 && (
        <div style={branchPickerStyle}>
          <p style={branchPickerLabelStyle}>Sign in as which branch?</p>
          <p style={branchPickerHelpStyle}>
            Acme Design Studio recruits from two campuses — each branch is its own
            account with its own dashboard. Pick one to prefill its credentials,
            then press Sign in.
          </p>
          <div
            role="group"
            aria-label="Choose a demo branch to sign in as"
            style={branchButtonRowStyle}
          >
            {DEMO_LOGINS.map((login) => {
              const active = username === login.username;
              return (
                <button
                  key={login.username}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseBranch(login)}
                  style={{
                    ...branchButtonStyle,
                    ...(active ? branchButtonActiveStyle : null),
                  }}
                >
                  {login.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form
        action={formAction}
        noValidate
        style={{ display: 'grid', gap: 'var(--space-5)' }}
      >
        <Field
          id="username"
          name="username"
          label="Username"
          required
          autoComplete="username"
          inputMode="email"
          help="Your registered corporate email, issued by NID after approval."
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <Field
            id="password"
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              style={forgotLinkStyle}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {state.status === 'error' && state.message && (
          <p role="alert" style={errorBannerStyle}>
            {state.message}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', margin: 0 }}>
            {selectedBranch
              ? `Signing in as ${selectedBranch.label}. Just press Sign in.`
              : 'Demo credentials are prefilled. Just press Sign in.'}
          </p>
        </div>
      </form>

      <Overlay
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Forgot your password?"
        width="520px"
      >
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0 }}>
            Recruiter accounts are created by the placement cell, not by self-signup. NID issues your
            username and password by email once your participation is approved — so there is no
            self-service reset.
          </p>
          <p style={{ margin: 0 }}>
            If you have lost your credentials, reply to the email NID sent when your application was
            approved, or write to the placement office. The team will re-issue access to your
            registered corporate email.
          </p>
          <div style={recoveryBoxStyle}>
            <p style={{ margin: 0, fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
              Haven&rsquo;t applied yet?
            </p>
            <p style={{ margin: 'var(--space-1) 0 0' }}>
              Start at the recruiter application — you&rsquo;ll get a ticket to track every step until
              credentials are issued.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <a href="/apply" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  Apply to recruit
                </Button>
              </a>
              <a href="/track" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">
                  Track an application
                </Button>
              </a>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
            Prototype note: in this demo the credentials above are prefilled for you, so you can sign
            in without recovery.
          </p>
        </div>
      </Overlay>

      <section aria-labelledby="login-faq-heading" style={{ marginTop: 'var(--space-10)' }}>
        <h2 id="login-faq-heading" style={faqHeadingStyle}>
          Frequently asked questions
        </h2>
        <p style={faqSubheadingStyle}>
          The same questions answered in the Sponsorship Guidelines — expand any item.
        </p>
        <Accordion items={FAQ} />
      </section>
    </>
  );
}

const branchPickerStyle = {
  marginBottom: 'var(--space-6)',
  padding: 'var(--space-4)',
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-2)',
} as const;

const branchPickerLabelStyle = {
  margin: '0 0 var(--space-1)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
} as const;

const branchPickerHelpStyle = {
  margin: '0 0 var(--space-3)',
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
} as const;

const branchButtonRowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 'var(--space-3)',
} as const;

const branchButtonStyle = {
  flex: '1 1 auto',
  minWidth: '180px',
  cursor: 'pointer',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  textAlign: 'center' as const,
  transition: 'border-color var(--input-motion), background-color var(--input-motion)',
} as const;

const branchButtonActiveStyle = {
  color: 'var(--accent)',
  borderColor: 'var(--accent)',
  backgroundColor: 'var(--surface-card)',
  boxShadow: 'inset 0 0 0 1px var(--accent)',
} as const;

const forgotLinkStyle = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textDecorationLine: 'underline',
  textUnderlineOffset: '2px',
} as const;

const errorBannerStyle = {
  margin: 0,
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--input-error-text)',
} as const;

const recoveryBoxStyle = {
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-2)',
  padding: 'var(--space-4)',
} as const;

const faqHeadingStyle = {
  margin: '0 0 var(--space-1)',
  fontSize: 'var(--fs-20)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
} as const;

const faqSubheadingStyle = {
  margin: '0 0 var(--space-4)',
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
} as const;
