import { Redis } from '@upstash/redis';

export function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Missing Upstash Redis environment variables.');
  }

  return new Redis({
    url,
    token,
    enableTelemetry: false
  });
}

export const redis =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string'
    ? createRedisClient()
    : null;
