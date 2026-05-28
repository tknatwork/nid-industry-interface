/**
 * Plain types + initial state for the apply form. Lives outside the
 * "use server" module so Next.js doesn't choke on non-function exports.
 */

export interface ApplyFormState {
  readonly status: 'idle' | 'error';
  readonly message: string;
  readonly fieldErrors: Record<string, string[]>;
  readonly values: Record<string, string>;
}

export const initialApplyState: ApplyFormState = {
  status: 'idle',
  message: '',
  fieldErrors: {},
  values: {},
};
