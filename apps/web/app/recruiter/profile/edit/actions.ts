'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateContactDetails } from '@nid/module-recruiter-onboarding';
import { readRecruiterSession } from '~/lib/recruiter-session';

/**
 * §L — recruiter self-service edit of the editable contact fields (corporate
 * email + primary phone + mock phone-verified flag). Identity fields (company
 * name, GST, registration number) are immutable and never accepted here.
 *
 * The schema mirrors the apply form's rules so the two entry points stay
 * consistent: a corporate (non-public) email, a phone in the accepted shape,
 * and — because the client soft-gates Save behind re-verification when the
 * number changes — a `phoneVerified` that must be `true` to persist. The page
 * is the only validation gate that matters for the demo; on success we
 * revalidate the read-only profile and redirect back to it.
 */

const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'protonmail.com',
] as const;

const updateContactSchema = z.object({
  corporateEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Provide a valid corporate email')
    .refine((email) => !PUBLIC_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`)), {
      message: 'Use a corporate email (not gmail / hotmail / yahoo)',
    }),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[+0-9 ()-]{7,20}$/, 'Provide a valid phone number'),
  // A changed number must be re-verified client-side; an unchanged one stays
  // verified. Either way we only persist a verified phone.
  phoneVerified: z.literal(true, {
    errorMap: () => ({ message: 'Verify your phone number before saving.' }),
  }),
});

export async function updateProfileAction(formData: FormData): Promise<void> {
  const { recruiterId } = await readRecruiterSession();

  const parsed = updateContactSchema.parse({
    corporateEmail: formData.get('corporateEmail'),
    contactPhone: formData.get('contactPhone'),
    phoneVerified: formData.get('phoneVerified') === 'true',
  });

  updateContactDetails({
    recruiterId,
    corporateEmail: parsed.corporateEmail,
    contactPhone: parsed.contactPhone,
    phoneVerified: parsed.phoneVerified,
  });

  revalidatePath('/recruiter/profile');
  redirect('/recruiter/profile');
}
