type RedisValue =
  | string
  | number
  | boolean
  | null
  | RedisValue[]
  | { [key: string]: RedisValue };

export class MockRedis {
  private readonly store = new Map<string, RedisValue>();

  async get<T extends RedisValue>(key: string): Promise<T | null> {
    return (this.store.get(key) ?? null) as T | null;
  }

  async set(key: string, value: RedisValue): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async hset(key: string, value: Record<string, RedisValue>): Promise<number> {
    this.store.set(key, value);
    return Object.keys(value).length;
  }

  async hgetall<T extends Record<string, RedisValue>>(
    key: string
  ): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  clear(): void {
    this.store.clear();
  }
}

export const mockRedis = new MockRedis();
