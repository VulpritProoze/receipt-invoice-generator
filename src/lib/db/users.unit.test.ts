import { mockRedis } from '@/lib/__mocks__/redis';
import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserByEmail
} from './users';
import { User } from '@/models/user';

describe('users database operations', () => {
  beforeEach(() => {
    // Clear mock Redis store before each test
    mockRedis.clear();
  });

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

      const stored = await mockRedis.get(`user:${validUser.userID}`);
      expect(stored).toEqual(validUser);
    });

    it('should create email index on user creation', async () => {
      await createUser(validUser);

      const emailIndex = await mockRedis.get(
        `user:email:${validUser.userEmail}`
      );
      expect(emailIndex).toBe(validUser.userID);
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
      await mockRedis.set(`user:${validUser.userID}`, {
        ...validUser,
        userEmail: 'not-an-email'
      });

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

    it('should update email index when email changes', async () => {
      const newEmail = 'newemail@example.com';

      await updateUser(validUser.userID, {
        userEmail: newEmail
      });

      // Old email index should be deleted
      const oldIndex = await mockRedis.get(`user:email:${validUser.userEmail}`);
      expect(oldIndex).toBeNull();

      // New email index should exist
      const newIndex = await mockRedis.get(`user:email:${newEmail}`);
      expect(newIndex).toBe(validUser.userID);
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

    it('should validate merged data after update', async () => {
      await expect(
        updateUser(validUser.userID, {
          creditCardNumber: '4111111111111111' // Unmasked
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    beforeEach(async () => {
      await createUser(validUser);
    });

    it('should delete user and email index', async () => {
      await deleteUser(validUser.userID);

      const user = await mockRedis.get(`user:${validUser.userID}`);
      expect(user).toBeNull();

      const emailIndex = await mockRedis.get(
        `user:email:${validUser.userEmail}`
      );
      expect(emailIndex).toBeNull();
    });

    it('should be idempotent for non-existent user', async () => {
      await deleteUser('non-existent-id');
      // Should not throw
    });

    it('should handle multiple deletes gracefully', async () => {
      await deleteUser(validUser.userID);
      await deleteUser(validUser.userID);
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

    it('should return null if email index exists but user deleted', async () => {
      // Delete user but leave email index (simulates inconsistent state)
      await mockRedis.del(`user:${validUser.userID}`);

      const found = await getUserByEmail(validUser.userEmail);
      expect(found).toBeNull();
    });
  });

  describe('key format validation', () => {
    it('should use correct key format for user data', async () => {
      await createUser(validUser);

      const keys = await mockRedis.keys('user:*');
      expect(keys).toContain(`user:${validUser.userID}`);
    });

    it('should use correct key format for email index', async () => {
      await createUser(validUser);

      const keys = await mockRedis.keys('user:email:*');
      expect(keys).toContain(`user:email:${validUser.userEmail}`);
    });
  });
});

// Made with Bob
