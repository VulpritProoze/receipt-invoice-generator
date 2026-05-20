import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BillGen',
  description: 'Generate invoices and receipts from imported billing data.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}