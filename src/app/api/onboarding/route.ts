import { NextRequest, NextResponse } from 'next/server';
import { companyConfigSchema } from '@/models/company';
import {
  completeOnboarding,
  getOnboardingProgress
} from '@/onboarding/onboardingService';

/**
 * GET /api/onboarding
 * Get onboarding status and config for a user.
 * Query params: userID (required)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userID = searchParams.get('userID');

    if (!userID) {
      return NextResponse.json(
        { error: 'userID query parameter is required' },
        { status: 400 }
      );
    }

    const progress = await getOnboardingProgress(userID);

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * Complete onboarding by storing company configuration.
 * Body: { userID: string, ...CompanyConfig fields }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract userID from body
    const { userID, ...configData } = body;

    if (!userID) {
      return NextResponse.json(
        { error: 'userID is required' },
        { status: 400 }
      );
    }

    // Validate company config data
    const result = companyConfigSchema.safeParse(configData);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid company configuration',
          details: result.error.flatten()
        },
        { status: 400 }
      );
    }

    // Store the validated config
    await completeOnboarding(userID, result.data);

    return NextResponse.json(
      { message: 'Onboarding completed successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

// Made with Bob
