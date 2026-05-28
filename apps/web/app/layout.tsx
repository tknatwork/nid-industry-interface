import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'NID Industry Interface',
  description:
    'Recruiter portal for the National Institute of Design — 3 legacy DPIIT campuses (Ahmedabad, Gandhinagar, Bengaluru R&D).',
  applicationName: 'NID Industry Interface',
  authors: [{ name: 'NID Placement Cell' }],
  keywords: ['NID', 'design', 'placement', 'recruitment', 'industry interface'],
  openGraph: {
    title: 'NID Industry Interface',
    description: 'Recruiter portal for the National Institute of Design.',
    siteName: 'NID Industry Interface',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Devanagari fallback for Hindi content — fixes the gap on the main NID site. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
