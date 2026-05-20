/**
 * @jest-environment node
 */

import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import * as onboardingService from '@/onboarding/onboardingService';
import { CompanyConfig } from '@/models/company';

// Mock the onboarding service
jest.mock('@/onboarding/onboardingService');

const mockGetOnboardingProgress = onboardingService.getOnboardingProgress as jest.MockedFunction<
  typeof onboardingService.getOnboardingProgress
>;
const mockCompleteOnboarding = onboardingService.completeOnboarding as jest.MockedFunction<
  typeof onboardingService.completeOnboarding
>;

describe('GET /api/onboarding', () => {
  const validConfig: CompanyConfig = {
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

  it('should return onboarding progress when userID is provided', async () => {
    mockGetOnboardingProgress.mockResolvedValue({
      complete: true,
      config: validConfig
    });

    const req = new NextRequest('http://localhost:3000/api/onboarding?userID=user-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      complete: true,
      config: validConfig
    });
    expect(mockGetOnboardingProgress).toHaveBeenCalledWith('user-123');
  });

  it('should return incomplete status when user has not completed onboarding', async () => {
    mockGetOnboardingProgress.mockResolvedValue({
      complete: false,
      config: null
    });

    const req = new NextRequest('http://localhost:3000/api/onboarding?userID=user-456');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      complete: false,
      config: null
    });
  });

  it('should return 400 when userID is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/onboarding');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'userID query parameter is required'
    });
    expect(mockGetOnboardingProgress).not.toHaveBeenCalled();
  });

  it('should return 500 when service throws error', async () => {
    mockGetOnboardingProgress.mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost:3000/api/onboarding?userID=user-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch onboarding status'
    });
  });
});

describe('POST /api/onboarding', () => {
  const validRequestBody = {
    userID: 'user-123',
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

  it('should complete onboarding with valid data', async () => {
    mockCompleteOnboarding.mockResolvedValue(undefined);

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(validRequestBody)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      message: 'Onboarding completed successfully'
    });
    expect(mockCompleteOnboarding).toHaveBeenCalledWith('user-123', {
      brandName: 'Test Brand',
      companyName: 'Test Company Inc.',
      companyUrl: 'https://example.com',
      logoUrl: 'https://example.com/logo.png',
      addressLine: '123 Test Street',
      postalAddress: 'Test City, TS 12345',
      country: 'Test Country'
    });
  });

  it('should return 400 when userID is missing', async () => {
    const { userID, ...bodyWithoutUserID } = validRequestBody;

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(bodyWithoutUserID)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'userID is required'
    });
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('should return 400 when brandName is missing', async () => {
    const { brandName, ...bodyWithoutBrandName } = validRequestBody;

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(bodyWithoutBrandName)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid company configuration');
    expect(data.details).toBeDefined();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('should return 400 when companyUrl is invalid', async () => {
    const invalidBody = {
      ...validRequestBody,
      companyUrl: 'not-a-valid-url'
    };

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(invalidBody)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid company configuration');
    expect(data.details).toBeDefined();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('should return 400 when logoUrl is invalid', async () => {
    const invalidBody = {
      ...validRequestBody,
      logoUrl: 'invalid-logo-url'
    };

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(invalidBody)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid company configuration');
    expect(data.details).toBeDefined();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('should return 400 when brandName exceeds max length', async () => {
    const invalidBody = {
      ...validRequestBody,
      brandName: 'a'.repeat(101) // Max is 100
    };

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(invalidBody)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid company configuration');
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('should return 500 when service throws error', async () => {
    mockCompleteOnboarding.mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost:3000/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(validRequestBody)
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to complete onboarding'
    });
  });
});

// Made with Bob
