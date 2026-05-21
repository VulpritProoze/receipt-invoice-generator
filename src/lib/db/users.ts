import { redis } from '@/lib/redis';
import { User, userSchema } from '@/models/user';
import * as sqliteUsers from './sqlite/users';

/**
 * Database operations for User entities.
 * Routes to SQLite (default) or Redis based on USE_REDIS environment variable.
 */

const useRedis = process.env.USE_REDIS === 'true';

/**
 * Create a new user.
 * Stores user data and creates email index for lookups.
 */
export async function createUser(user: User): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Validate user data before storing
    const validated = userSchema.parse(user);

    // Store user data
    await redis.set(`user:${validated.userID}`, validated);

    // Create email index for getUserByEmail
    await redis.set(`user:email:${validated.userEmail}`, validated.userID);
  } else {
    return sqliteUsers.createUser(user);
  }
}

/**
 * Get a user by their ID.
 * Returns null if user does not exist.
 */
export async function getUser(userID: string): Promise<User | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    const data = await redis.get<unknown>(`user:${userID}`);

    if (!data) {
      return null;
    }

    // Validate retrieved data through schema
    try {
      return userSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid user data in database for userID: ${userID}. Data integrity check failed.`,
        { cause: error }
      );
    }
  } else {
    return sqliteUsers.getUser(userID);
  }
}

/**
 * Update a user's fields.
 * Only updates provided fields, leaves others unchanged.
 */
export async function updateUser(
  userID: string,
  updates: Partial<User>
): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Get existing user
    const existing = await getUser(userID);

    if (!existing) {
      throw new Error(`User not found: ${userID}`);
    }

    // Merge updates with existing data
    const updated = { ...existing, ...updates };

    // Validate merged data
    const validated = userSchema.parse(updated);

    // If email changed, update the email index
    if (updates.userEmail && updates.userEmail !== existing.userEmail) {
      // Remove old email index
      await redis.del(`user:email:${existing.userEmail}`);
      // Create new email index
      await redis.set(`user:email:${validated.userEmail}`, validated.userID);
    }

    // Store updated user
    await redis.set(`user:${userID}`, validated);
  } else {
    return sqliteUsers.updateUser(userID, updates);
  }
}

/**
 * Delete a user and their email index.
 */
export async function deleteUser(userID: string): Promise<void> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Get user to find their email for index cleanup
    const user = await getUser(userID);

    if (!user) {
      // User doesn't exist - this is not an error, operation is idempotent
      return;
    }

    // Delete email index
    await redis.del(`user:email:${user.userEmail}`);

    // Delete user data
    await redis.del(`user:${userID}`);
  } else {
    return sqliteUsers.deleteUser(userID);
  }
}

/**
 * Find a user by their email address.
 * Returns null if no user with that email exists.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (useRedis) {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Look up userID from email index
    const userID = await redis.get<string>(`user:email:${email}`);

    if (!userID) {
      return null;
    }

    // Retrieve user by ID
    return getUser(userID);
  } else {
    return sqliteUsers.getUserByEmail(email);
  }
}

// Made with Bob
