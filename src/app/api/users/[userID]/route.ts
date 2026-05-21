import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
} from '@/modules/users/userService';

/**
 * GET /api/users/[userID] - Get user profile
 * Response: 200 with user, 404 if not found, or 500 on error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const { userID } = await params;

    const user = await getUserProfile(userID);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error getting user profile:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[userID] - Update user profile
 * Request body: Partial user data (fields to update)
 * Response: 200 with updated user, 404 if not found, 400 on validation error, or 500 on error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const { userID } = await params;
    const body = await req.json();

    // Don't allow updating userID
    if (body.userID) {
      return NextResponse.json(
        { error: 'Cannot update userID' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfile(userID, body);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    // Log error server-side with context
    console.error('Error updating user profile:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message === 'Email already in use by another account') {
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
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[userID] - Delete user account and all associated data
 * Response: 200 on success, or 500 on error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const { userID } = await params;

    await deleteUserAccount(userID);

    return NextResponse.json(
      { message: 'User account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Log error server-side with context
    console.error('Error deleting user account:', error);

    // Generic error response - don't expose internal details
    return NextResponse.json(
      { error: 'Failed to delete user account' },
      { status: 500 }
    );
  }
}

// Made with Bob
