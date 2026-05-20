import '@testing-library/jest-dom';

// Automatically mock the Redis module for all tests
// Jest will use src/lib/__mocks__/redis.ts
jest.mock('@/lib/redis');

// Note: Mock Redis clearing is handled in individual test files
// to ensure proper test isolation and avoid timing issues
