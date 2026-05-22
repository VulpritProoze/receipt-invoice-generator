/**
 * Authentication utilities for server-side operations
 * 
 * This module provides server-side authentication helpers used by API routes
 * and Server Components to access the current user's identity.
 * 
 * Current implementation: Returns demo user ID
 * 
 * TODO: Replace with real authentication:
 * - Validate JWT tokens from request headers/cookies
 * - Integrate with NextAuth.js session management
 * - Handle token refresh and expiration
 * - Implement proper error handling for invalid/expired tokens
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get the current authenticated user's ID
 * 
 * @returns User ID string, or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  // @ts-ignore NextAuth session.user may not have an id by default without extending the types
  const userId = session.user.id || session.user.email || 'unknown';
  
  // Single-tenant fallback: map admin emails/legacy IDs to the default demo user
  if (userId === 'admin@example.com' || userId === 'admin') {
    return 'demo-user-001';
  }
  
  return userId;
}

/**
 * Get the current authenticated user's email
 * 
 * @returns User email string, or null if not authenticated
 * 
 * TODO: Implement real session validation
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

/**
 * Check if a request is authenticated
 * 
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}

/**
 * Require authentication - throws if not authenticated
 * 
 * Use in API routes that require authentication:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   await requireAuth(); // Throws if not authenticated
 *   // ... rest of handler
 * }
 * ```
 * 
 * @throws Error if not authenticated
 * 
 * TODO: Implement real authentication requirement
 */
export async function requireAuth(): Promise<void> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Authentication required');
  }
}

// Made with Bob
