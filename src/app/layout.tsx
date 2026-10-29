import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Divine — AI Operations & Procurement Assistant | Sixth Sense Studio',
  description:
    'Air-gapped preparation, verification, comparison, and drafting assistant for Sixth Sense Studio (Procurement, Houzz Pro Tracker & Budgets, Vendor-Payment Prep, Payroll Prep, Logs & Reminders).',
  icons: {
    icon: '/divine-logo.png',
    apple: '/divine-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-amber-200 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
