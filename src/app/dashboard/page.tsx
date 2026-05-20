import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkOnboardingStatus } from '@/onboarding/onboardingService';

/**
 * Dashboard page - Server Component
 * Checks onboarding status and redirects to onboarding if not complete.
 * Shows welcome message and navigation links if complete.
 */
export default async function DashboardPage() {
  // TODO: Get actual userID from authentication session
  // For now, using a placeholder - this will be replaced with real auth
  const userID = 'demo-user-001';

  // Check if user has completed onboarding
  const isComplete = await checkOnboardingStatus(userID);

  if (!isComplete) {
    // User has not completed onboarding, redirect to onboarding page
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white shadow rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to BillGen</h1>
          <p className="text-lg text-gray-600">
            Your company profile is set up. You're ready to create invoices and receipts.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Invoice */}
          <Link
            href="/invoices/create"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Invoice</h2>
            <p className="text-gray-600">
              Generate professional invoices for your clients
            </p>
          </Link>

          {/* Generate Receipt */}
          <Link
            href="/receipts"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generate Receipt</h2>
            <p className="text-gray-600">
              Create payment receipts from existing invoices
            </p>
          </Link>

          {/* Import Data */}
          <Link
            href="/import"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Data</h2>
            <p className="text-gray-600">
              Upload billing history from CSV or Excel files
            </p>
          </Link>
        </div>

        {/* Recent Activity Section (placeholder) */}
        <div className="mt-8 bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-600">
            Your recent invoices and receipts will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
