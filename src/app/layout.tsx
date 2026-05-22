import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/providers/auth-provider';
import NextAuthSessionProvider from '@/providers/session-provider';

export const metadata: Metadata = {
  title: 'BillGen',
  description: 'Generate invoices and receipts from imported billing data.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider>
          <AuthProvider>
            <Nav />

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>

            <Footer />
          </AuthProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
