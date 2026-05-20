import { redirect } from 'next/navigation';
import OnboardingForm from './OnboardingForm';
import { checkOnboardingStatus } from '@/onboarding/onboardingService';

/**
 * Onboarding page - Server Component
 * Checks if user has already completed onboarding and redirects if so.
 * Otherwise, renders the onboarding form.
 */
export default async function OnboardingPage() {
  // TODO: Get actual userID from authentication session
  // For now, using a placeholder - this will be replaced with real auth
  const userID = 'demo-user-001';

  // Check if user has already completed onboarding
  const isComplete = await checkOnboardingStatus(userID);

  if (isComplete) {
    // User has already completed onboarding, redirect to dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to BillGen</h1>
          <p className="text-lg text-gray-600">
            Let's set up your company profile to get started
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Company Info</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Start Using</span>
            </div>
          </div>
        </div>

        <OnboardingForm userID={userID} />
      </div>
    </div>
  );
}

// Made with Bob
