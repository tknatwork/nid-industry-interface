import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function AdminRoot() {
  // Admin landing redirects to the recruiter queue for now. As more admin
  // surfaces ship, this will become a dashboard.
  redirect('/admin/recruiters/queue');
}
