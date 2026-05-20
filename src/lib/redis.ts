import { Redis } from '@upstash/redis';

/**
 * Redis client wrapper with error handling and retry logic.
 * Uses Upstash Redis (serverless Redis) for data persistence.
 *
 * Error handling strategy:
 * - Connection errors: throw descriptive errors with context
 * - Transient failures: retry up to 3 times with exponential backoff
 * - Parse errors: throw with details about the invalid data
 * - Not-found cases: return null (not an error condition)
 */

export interface RedisConfig {
  url: string;
  token: string;
  enableTelemetry?: boolean;
  retryAttempts?: number;
  retryDelayMs?: number;
}

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

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a Redis client with the provided configuration.
 * Validates that required environment variables are present.
 */
export function createRedisClient(config?: Partial<RedisConfig>): Redis {
  const url = config?.url ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = config?.token ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new RedisError(
      'Missing Upstash Redis environment variables. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.',
      'createClient'
    );
  }

  return new Redis({
    url,
    token,
    enableTelemetry: config?.enableTelemetry ?? false
  });
}

/**
 * Retry a Redis operation with exponential backoff.
 * Used for transient failures like network timeouts.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  key?: string,
  maxAttempts = 3,
  baseDelayMs = 100
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }

  // All retries exhausted
  throw new RedisError(
    `Redis operation failed after ${maxAttempts} attempts`,
    operationName,
    key,
    lastError
  );
}

/**
 * Wrapped Redis client with enhanced error handling.
 * All operations include retry logic and descriptive error messages.
 */
export class RedisClient {
  constructor(private readonly client: Redis) {}

  /**
   * Get a value from Redis by key.
   * Returns null if the key does not exist (not an error).
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await withRetry(
        () => this.client.get<T>(key),
        'get',
        key
      );
    } catch (error) {
      throw new RedisError(
        `Failed to get key: ${key}`,
        'get',
        key,
        error
      );
    }
  }

  /**
   * Set a value in Redis.
   * Value is automatically JSON-serialized by Upstash client.
   */
  async set(key: string, value: unknown): Promise<void> {
    try {
      await withRetry(
        () => this.client.set(key, value),
        'set',
        key
      );
    } catch (error) {
      throw new RedisError(
        `Failed to set key: ${key}`,
        'set',
        key,
        error
      );
    }
  }

  /**
   * Delete a key from Redis.
   * Returns the number of keys deleted (0 or 1).
   */
  async del(key: string): Promise<number> {
    try {
      return await withRetry(
        () => this.client.del(key),
        'del',
        key
      );
    } catch (error) {
      throw new RedisError(
        `Failed to delete key: ${key}`,
        'del',
        key,
        error
      );
    }
  }

  /**
   * Set multiple fields in a hash.
   * Returns the number of fields added.
   */
  async hset(key: string, value: Record<string, unknown>): Promise<number> {
    try {
      return await withRetry(
        () => this.client.hset(key, value),
        'hset',
        key
      );
    } catch (error) {
      throw new RedisError(
        `Failed to hset key: ${key}`,
        'hset',
        key,
        error
      );
    }
  }

  /**
   * Get all fields from a hash.
   * Returns null if the key does not exist.
   */
  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    try {
      const result = await withRetry(
        () => this.client.hgetall<T>(key),
        'hgetall',
        key
      );
      // Upstash returns empty object for non-existent keys, normalize to null
      return result && Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      throw new RedisError(
        `Failed to hgetall key: ${key}`,
        'hgetall',
        key,
        error
      );
    }
  }

  /**
   * Scan for keys matching a pattern.
   * Returns an array of matching keys.
   * Note: SCAN is used for large keyspaces; for small sets, this returns all matches.
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await withRetry(
        () => this.client.keys(pattern),
        'keys',
        pattern
      );
    } catch (error) {
      throw new RedisError(
        `Failed to scan keys with pattern: ${pattern}`,
        'keys',
        pattern,
        error
      );
    }
  }

  /**
   * Increment a counter and return the new value.
   * Used for generating sequential IDs.
   */
  async incr(key: string): Promise<number> {
    try {
      return await withRetry(
        () => this.client.incr(key),
        'incr',
        key
      );
    } catch (error) {
      throw new RedisError(
        `Failed to increment key: ${key}`,
        'incr',
        key,
        error
      );
    }
  }
}

/**
 * Singleton Redis client instance.
 * Null in test environments where env vars are not set.
 */
export const redis =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string'
    ? new RedisClient(createRedisClient())
    : null;
