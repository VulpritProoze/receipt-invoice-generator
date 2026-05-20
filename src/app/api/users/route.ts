import { NextRequest, NextResponse } from 'next/server';
import { userSchema } from '@/models/user';
import { registerUser, findUserByEmail } from '@/modules/users/userService';

/**
 * POST /api/users - Create a new user
 * Request body: User data without userID (will be generated)
 * Response: 201 with created user, or 400/500 on error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body - expect all user fields except userID
    const requiredFields = [
      'username',
      'userEmail',
      'fullName',
      'creditCardNumber',
      'creditCardType'
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: { missingFields }
        },
        { status: 400 }
      );
    }

    // Register user (will mask credit card and generate UUID)
    const user = await registerUser({
      username: body.username,
      userEmail: body.userEmail,
      fullName: body.fullName,
      creditCardNumber: body.creditCardNumber,
      creditCardType: body.creditCardType
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error creating user:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Zod validation errors
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Invalid user data',
            details: error.message
          },
          { status: 400 }
        );
      }
    }

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users?email=user@example.com - Find user by email
 * Query params: email (optional)
 * Response: 200 with user or null, or 400/500 on error
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error finding user by email:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to find user' },
      { status: 500 }
    );
  }
}

// Made with Bob