/**
 * Mock Redis client for testing.
 * Implements an in-memory key-value store that mimics Redis behavior.
 * Automatically cleared between test cases via jest.setup.ts.
 */

type RedisValue =
  | string
  | number
  | boolean
  | null
  | RedisValue[]
  | { [key: string]: RedisValue };

export class MockRedisClient {
  private readonly store = new Map<string, RedisValue>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) ?? null) as T | null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value as RedisValue);
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async hset(key: string, value: Record<string, unknown>): Promise<number> {
    this.store.set(key, value as RedisValue);
    return Object.keys(value).length;
  }

  async hgetall<T extends Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    const value = this.store.get(key);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return Object.keys(value).length > 0 ? (value as T) : null;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching: convert Redis pattern to regex
    // Supports * (any chars) and ? (single char)
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*') // * matches any chars
      .replace(/\?/g, '.'); // ? matches single char
    const regex = new RegExp(`^${regexPattern}$`);

    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async incr(key: string): Promise<number> {
    const current = this.store.get(key);
    const value = typeof current === 'number' ? current + 1 : 1;
    this.store.set(key, value);
    return value;
  }

  clear(): void {
    this.store.clear();
  }
}

// Create singleton mock instance - this is the shared store
export const mockRedis = new MockRedisClient();

// Mock the RedisClient class - all instances delegate to mockRedis singleton
export class RedisClient {
  async get<T>(key: string): Promise<T | null> {
    return mockRedis.get<T>(key);
  }

  async set(key: string, value: unknown): Promise<void> {
    return mockRedis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return mockRedis.del(key);
  }

  async hset(key: string, value: Record<string, unknown>): Promise<number> {
    return mockRedis.hset(key, value);
  }

  async hgetall<T extends Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    return mockRedis.hgetall<T>(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return mockRedis.keys(pattern);
  }

  async incr(key: string): Promise<number> {
    return mockRedis.incr(key);
  }
}

// Export redis as a RedisClient instance (matching the real module's export)
// This instance delegates to mockRedis, so all operations share the same store
export const redis = new RedisClient();

// Also export createRedisClient for completeness
export function createRedisClient() {
  return new RedisClient();
}

// Mock the RedisError class
export class RedisError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly key?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RedisError';
  }
}
