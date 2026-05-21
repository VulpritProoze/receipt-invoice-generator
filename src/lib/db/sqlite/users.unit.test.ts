import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserByEmail
} from './users';
import { User } from '@/models/user';
import { db } from '@/lib/db.sqlite';

describe('SQLite users database operations', () => {
  const validUser: User = {
    userID: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    userEmail: 'test@example.com',
    fullName: 'Test User',
    creditCardNumber: '**** **** **** 1234',
    creditCardType: 'Visa'
  };

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      await createUser(validUser);

      const row = db.prepare('SELECT * FROM users WHERE user_id = ?').get(validUser.userID) as { user_id: string; username: string; user_email: string } | undefined;
      expect(row).toBeDefined();
      expect(row?.user_id).toBe(validUser.userID);
      expect(row?.username).toBe(validUser.username);
      expect(row?.user_email).toBe(validUser.userEmail);
    });

    it('should reject invalid user data', async () => {
      const invalidUser = {
        ...validUser,
        userEmail: 'not-an-email'
      };

      await expect(createUser(invalidUser as User)).rejects.toThrow();
    });

    it('should reject user with unmasked credit card', async () => {
      const invalidUser = {
        ...validUser,
        creditCardNumber: '4111111111111111'
      };

      await expect(createUser(invalidUser as User)).rejects.toThrow();
    });
  });

  describe('getUser', () => {
    it('should retrieve an existing user', async () => {
      await createUser(validUser);

      const retrieved = await getUser(validUser.userID);
      expect(retrieved).toEqual(validUser);
    });

    it('should return null for non-existent user', async () => {
      const retrieved = await getUser('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should throw error for corrupted user data', async () => {
      // Store invalid data directly
      db.prepare(`
        INSERT INTO users (user_id, username, user_email, full_name, credit_card_number, credit_card_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        validUser.userID,
        validUser.username,
        'not-an-email', // Corrupted
        validUser.fullName,
        validUser.creditCardNumber,
        validUser.creditCardType
      );

      await expect(getUser(validUser.userID)).rejects.toThrow(
        'Invalid user data in database'
      );
    });
  });

  describe('updateUser', () => {
    beforeEach(async () => {
      await createUser(validUser);
    });

    it('should update user fields', async () => {
      await updateUser(validUser.userID, {
        fullName: 'Updated Name'
      });

      const updated = await getUser(validUser.userID);
      expect(updated?.fullName).toBe('Updated Name');
      expect(updated?.userEmail).toBe(validUser.userEmail); // Unchanged
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        updateUser('non-existent-id', { fullName: 'Test' })
      ).rejects.toThrow('User not found');
    });

    it('should reject invalid updates', async () => {
      await expect(
        updateUser(validUser.userID, {
          userEmail: 'not-an-email'
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    beforeEach(async () => {
      await createUser(validUser);
    });

    it('should delete user', async () => {
      await deleteUser(validUser.userID);

      const retrieved = await getUser(validUser.userID);
      expect(retrieved).toBeNull();
    });

    it('should be idempotent for non-existent user', async () => {
      await deleteUser('non-existent-id');
      // Should not throw
    });
  });

  describe('getUserByEmail', () => {
    beforeEach(async () => {
      await createUser(validUser);
    });

    it('should find user by email', async () => {
      const found = await getUserByEmail(validUser.userEmail);
      expect(found).toEqual(validUser);
    });

    it('should return null for non-existent email', async () => {
      const found = await getUserByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });
  });
});
