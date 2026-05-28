'use server';

import { redirect } from 'next/navigation';
import { submit } from '@nid/module-recruiter-onboarding';
import type { ApplyFormState } from './state';

export async function submitApplyAction(
  _prev: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  // Collect form values for re-rendering on validation failure.
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }

  const input = {
    companyName: values['companyName'] ?? '',
    sector: values['sector'] ?? '',
    gst: (values['gst'] ?? '').toUpperCase(),
    registrationNumber: values['registrationNumber'] ?? '',
    corporateEmail: values['corporateEmail'] ?? '',
    websiteUrl: values['websiteUrl'] ?? '',
    contactName: values['contactName'] ?? '',
    contactPhone: values['contactPhone'] ?? '',
    cycleId: values['cycleId'] ?? 'cycle_spring_2026',
  };

  const result = submit(input);
  if (!result.ok) {
    return {
      status: 'error',
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }
  redirect(result.result.trackerPath);
}
