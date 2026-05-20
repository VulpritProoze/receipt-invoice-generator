import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  registerUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  findUserByEmail
} from './userService';
import * as dbUsers from '@/lib/db/users';
import * as dbInvoices from '@/lib/db/invoices';
import * as dbReceipts from '@/lib/db/receipts';
import * as maskCreditCardModule from '@/lib/maskCreditCard';
import { User } from '@/models/user';

// Mock all database operations
jest.mock('@/lib/db/users');
jest.mock('@/lib/db/invoices');
jest.mock('@/lib/db/receipts');
jest.mock('@/lib/maskCreditCard');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create a new user with generated UUID and masked credit card', async () => {
      const mockMaskedCard = '**** **** **** 1234';
      (dbUsers.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (maskCreditCardModule.maskCreditCard as jest.Mock).mockReturnValue(mockMaskedCard);
      (dbUsers.createUser as jest.Mock).mockResolvedValue(undefined);

      const userData = {
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      };

      const result = await registerUser(userData);

      expect(result.userID).toBe('test-uuid-1234');
      expect(result.creditCardNumber).toBe(mockMaskedCard);
      expect(maskCreditCardModule.maskCreditCard).toHaveBeenCalledWith('4111111111111111');
      expect(dbUsers.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userID: 'test-uuid-1234',
          username: 'testuser',
          userEmail: 'test@example.com',
          creditCardNumber: mockMaskedCard
        })
      );
    });

    it('should throw error if email already exists', async () => {
      const existingUser: User = {
        userID: 'existing-id',
        username: 'existing',
        userEmail: 'test@example.com',
        fullName: 'Existing User',
        creditCardNumber: '**** **** **** 5678',
        creditCardType: 'Mastercard'
      };

      (dbUsers.getUserByEmail as jest.Mock).mockResolvedValue(existingUser);

      const userData = {
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '4111111111111111',
        creditCardType: 'Visa'
      };

      await expect(registerUser(userData)).rejects.toThrow('Email already registered');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      (dbUsers.getUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserProfile('user-123');

      expect(result).toEqual(mockUser);
      expect(dbUsers.getUser).toHaveBeenCalledWith('user-123');
    });

    it('should return null if user not found', async () => {
      (dbUsers.getUser as jest.Mock).mockResolvedValue(null);

      const result = await getUserProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile and return updated user', async () => {
      const existingUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      const updatedUser: User = {
        ...existingUser,
        fullName: 'Updated Name'
      };

      (dbUsers.getUser as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      (dbUsers.updateUser as jest.Mock).mockResolvedValue(undefined);

      const result = await updateUserProfile('user-123', { fullName: 'Updated Name' });

      expect(result.fullName).toBe('Updated Name');
      expect(dbUsers.updateUser).toHaveBeenCalledWith('user-123', { fullName: 'Updated Name' });
    });

    it('should mask credit card when updating', async () => {
      const existingUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      const mockMaskedCard = '**** **** **** 5678';
      (dbUsers.getUser as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ ...existingUser, creditCardNumber: mockMaskedCard });
      (maskCreditCardModule.maskCreditCard as jest.Mock).mockReturnValue(mockMaskedCard);
      (dbUsers.updateUser as jest.Mock).mockResolvedValue(undefined);

      await updateUserProfile('user-123', { creditCardNumber: '5555555555555555' });

      expect(maskCreditCardModule.maskCreditCard).toHaveBeenCalledWith('5555555555555555');
      expect(dbUsers.updateUser).toHaveBeenCalledWith('user-123', {
        creditCardNumber: mockMaskedCard
      });
    });

    it('should throw error if user not found', async () => {
      (dbUsers.getUser as jest.Mock).mockResolvedValue(null);

      await expect(updateUserProfile('nonexistent', { fullName: 'New Name' })).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error if email is taken by another user', async () => {
      const existingUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      const otherUser: User = {
        userID: 'user-456',
        username: 'otheruser',
        userEmail: 'other@example.com',
        fullName: 'Other User',
        creditCardNumber: '**** **** **** 5678',
        creditCardType: 'Mastercard'
      };

      (dbUsers.getUser as jest.Mock).mockResolvedValue(existingUser);
      (dbUsers.getUserByEmail as jest.Mock).mockResolvedValue(otherUser);

      await expect(
        updateUserProfile('user-123', { userEmail: 'other@example.com' })
      ).rejects.toThrow('Email already in use by another account');
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete user and all associated data', async () => {
      const mockUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      const mockReceipts = [
        { receiptID: 'receipt-1', userID: 'user-123' },
        { receiptID: 'receipt-2', userID: 'user-123' }
      ];

      const mockInvoices = [
        { invoiceID: 'INV000000001', userID: 'user-123' },
        { invoiceID: 'INV000000002', userID: 'user-123' }
      ];

      (dbUsers.getUser as jest.Mock).mockResolvedValue(mockUser);
      (dbReceipts.listReceipts as jest.Mock).mockResolvedValue(mockReceipts);
      (dbInvoices.listInvoices as jest.Mock).mockResolvedValue(mockInvoices);
      (dbReceipts.deleteReceipt as jest.Mock).mockResolvedValue(undefined);
      (dbInvoices.deleteInvoice as jest.Mock).mockResolvedValue(undefined);
      (dbUsers.deleteUser as jest.Mock).mockResolvedValue(undefined);

      await deleteUserAccount('user-123');

      expect(dbReceipts.deleteReceipt).toHaveBeenCalledTimes(2);
      expect(dbInvoices.deleteInvoice).toHaveBeenCalledTimes(2);
      expect(dbUsers.deleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should be idempotent if user does not exist', async () => {
      (dbUsers.getUser as jest.Mock).mockResolvedValue(null);

      await deleteUserAccount('nonexistent');

      expect(dbUsers.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const mockUser: User = {
        userID: 'user-123',
        username: 'testuser',
        userEmail: 'test@example.com',
        fullName: 'Test User',
        creditCardNumber: '**** **** **** 1234',
        creditCardType: 'Visa'
      };

      (dbUsers.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(dbUsers.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null if email not found', async () => {
      (dbUsers.getUserByEmail as jest.Mock).mockResolvedValue(null);

      const result = await findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});

// Made with Bob