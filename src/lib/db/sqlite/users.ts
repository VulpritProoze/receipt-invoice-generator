import { db } from '@/lib/db.sqlite';
import { User, userSchema } from '@/models/user';

/**
 * SQLite database operations for User entities.
 */

export async function createUser(user: User): Promise<void> {
  const validated = userSchema.parse(user);

  try {
    const stmt = db.prepare(`
      INSERT INTO users (user_id, username, user_email, full_name, credit_card_number, credit_card_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      validated.userID,
      validated.username,
      validated.userEmail,
      validated.fullName,
      validated.creditCardNumber,
      validated.creditCardType
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`User with email ${validated.userEmail} already exists`, { cause: error });
    }
    throw error;
  }
}

export async function getUser(userID: string): Promise<User | null> {
  const stmt = db.prepare(`
    SELECT user_id as userID, username, user_email as userEmail, full_name as fullName, credit_card_number as creditCardNumber, credit_card_type as creditCardType
    FROM users
    WHERE user_id = ?
  `);
  const row = stmt.get(userID) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return userSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid user data in database for userID: ${userID}. Data integrity check failed.`,
      { cause: error }
    );
  }
}

export async function updateUser(
  userID: string,
  updates: Partial<User>
): Promise<void> {
  const existing = await getUser(userID);

  if (!existing) {
    throw new Error(`User not found: ${userID}`);
  }

  const updated = { ...existing, ...updates };
  const validated = userSchema.parse(updated);

  const stmt = db.prepare(`
    UPDATE users
    SET username = ?, user_email = ?, full_name = ?, credit_card_number = ?, credit_card_type = ?
    WHERE user_id = ?
  `);
  stmt.run(
    validated.username,
    validated.userEmail,
    validated.fullName,
    validated.creditCardNumber,
    validated.creditCardType,
    userID
  );
}

export async function deleteUser(userID: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM users WHERE user_id = ?');
  stmt.run(userID);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const stmt = db.prepare(`
    SELECT user_id as userID, username, user_email as userEmail, full_name as fullName, credit_card_number as creditCardNumber, credit_card_type as creditCardType
    FROM users
    WHERE user_email = ?
  `);
  const row = stmt.get(email) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  try {
    return userSchema.parse(row);
  } catch (error) {
    throw new Error(
      `Invalid user data in database for email: ${email}. Data integrity check failed.`,
      { cause: error }
    );
  }
}
