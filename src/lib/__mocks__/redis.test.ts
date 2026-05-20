import { mockRedis, redis } from './redis';

describe('Mock Redis verification', () => {
  beforeEach(() => {
    mockRedis.clear();
  });

  it('should store and retrieve data via redis export', async () => {
    await redis.set('test-key', 'test-value');
    const value = await redis.get('test-key');
    expect(value).toBe('test-value');
  });

  it('should share store between redis and mockRedis', async () => {
    await redis.set('test-key', 'test-value');
    const value = await mockRedis.get('test-key');
    expect(value).toBe('test-value');
  });

  it('should store objects', async () => {
    const obj = { name: 'test', value: 123 };
    await redis.set('test-obj', obj);
    const retrieved = await mockRedis.get('test-obj');
    expect(retrieved).toEqual(obj);
  });
});

// Made with Bob
