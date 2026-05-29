'use server';

import { redirect } from 'next/navigation';

export async function submitFeedbackAction(formData: FormData): Promise<void> {
  const rating = (formData.get('rating') as string | null)?.trim() ?? '';
  const comments = (formData.get('comments') as string | null)?.trim() ?? '';

  if (rating === '' || comments === '') {
    redirect('/student/feedback?error=' + encodeURIComponent('Please add both a rating and a comment.'));
  }

  // No store — post-cycle feedback is collected anonymously for the demo and the
  // page just confirms receipt.
  redirect('/student/feedback?sent=1');
}
