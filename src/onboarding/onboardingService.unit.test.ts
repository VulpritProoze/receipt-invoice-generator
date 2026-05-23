import {
  checkOnboardingStatus,
  completeOnboarding,
  getOnboardingProgress
} from './onboardingService';
import { getCompanyConfig, setCompanyConfig } from '@/lib/db/company';
import { CompanyConfig } from '@/models/company';

// Mock the database layer
jest.mock('@/lib/db/company');

const mockGetCompanyConfig = getCompanyConfig as jest.MockedFunction<
  typeof getCompanyConfig
>;
const mockSetCompanyConfig = setCompanyConfig as jest.MockedFunction<
  typeof setCompanyConfig
>;

describe('onboardingService', () => {
  const testUserID = 'user-123';
  const validConfig: CompanyConfig = {
    companyID: 'company-123',
    brandName: 'Test Brand',
    companyName: 'Test Company Inc.',
    companyUrl: 'https://example.com',
    logoUrl: 'https://example.com/logo.png',
    addressLine: '123 Test Street',
    postalAddress: 'Test City, TS 12345',
    country: 'Test Country'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkOnboardingStatus', () => {
    it('should return true when company config exists', async () => {
      mockGetCompanyConfig.mockResolvedValue(validConfig);

      const result = await checkOnboardingStatus(testUserID);

      expect(result).toBe(true);
      expect(mockGetCompanyConfig).toHaveBeenCalledWith(testUserID);
    });

    it('should return false when company config does not exist', async () => {
      mockGetCompanyConfig.mockResolvedValue(null);

      const result = await checkOnboardingStatus(testUserID);

      expect(result).toBe(false);
      expect(mockGetCompanyConfig).toHaveBeenCalledWith(testUserID);
    });

    it('should propagate errors from database layer', async () => {
      mockGetCompanyConfig.mockRejectedValue(
        new Error('Redis connection failed')
      );

      await expect(checkOnboardingStatus(testUserID)).rejects.toThrow(
        'Redis connection failed'
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should store company config for user', async () => {
      mockSetCompanyConfig.mockResolvedValue(undefined);

      await completeOnboarding(testUserID, validConfig);

      expect(mockSetCompanyConfig).toHaveBeenCalledWith(
        testUserID,
        validConfig
      );
    });

    it('should propagate validation errors from database layer', async () => {
      mockSetCompanyConfig.mockRejectedValue(new Error('Validation failed'));

      await expect(completeOnboarding(testUserID, validConfig)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should propagate database errors', async () => {
      mockSetCompanyConfig.mockRejectedValue(new Error('Redis write failed'));

      await expect(completeOnboarding(testUserID, validConfig)).rejects.toThrow(
        'Redis write failed'
      );
    });
  });

  describe('getOnboardingProgress', () => {
    it('should return complete status with config when onboarding is done', async () => {
      mockGetCompanyConfig.mockResolvedValue(validConfig);

      const result = await getOnboardingProgress(testUserID);

      expect(result).toEqual({
        complete: true,
        config: validConfig
      });
      expect(mockGetCompanyConfig).toHaveBeenCalledWith(testUserID);
    });

    it('should return incomplete status with null config when onboarding not done', async () => {
      mockGetCompanyConfig.mockResolvedValue(null);

      const result = await getOnboardingProgress(testUserID);

      expect(result).toEqual({
        complete: false,
        config: null
      });
      expect(mockGetCompanyConfig).toHaveBeenCalledWith(testUserID);
    });

    it('should propagate errors from database layer', async () => {
      mockGetCompanyConfig.mockRejectedValue(new Error('Database error'));

      await expect(getOnboardingProgress(testUserID)).rejects.toThrow(
        'Database error'
      );
    });
  });
});

// Made with Bob
