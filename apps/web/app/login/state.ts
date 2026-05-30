/**
 * Login form state, threaded through `useActionState`. Kept in a plain module
 * (not the `'use server'` action file) so the Client Component can import the
 * type and the initial value without pulling the action's server-only deps.
 */

export interface LoginFormState {
  readonly status: 'idle' | 'error';
  /** Top-level error banner copy (e.g. wrong credentials). */
  readonly message?: string;
}

export const initialLoginState: LoginFormState = { status: 'idle' };
