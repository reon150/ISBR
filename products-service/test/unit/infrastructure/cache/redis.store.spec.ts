import { RedisStore } from '@infrastructure/cache/redis.store';

// Mock redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  flushAll: jest.fn(),
  on: jest.fn(),
};

// Mock redis createClient
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('RedisStore', () => {
  let redisStore: RedisStore;
  const mockOptions = {
    host: 'localhost',
    port: 6379,
    connectTimeout: 30000,
    retryDelayOnFailover: 2000,
    maxAttempts: 10,
  };

  beforeEach(() => {
    redisStore = new RedisStore(mockOptions);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await redisStore.disconnect();
  });

  it('should be defined', () => {
    expect(redisStore).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      const store = new RedisStore(mockOptions);
      expect(store).toBeDefined();
    });
  });

  describe('get', () => {
    it('should handle Redis errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await redisStore.get('test-key');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should handle Redis error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const testValue = { id: '1', name: 'test' };
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await redisStore.set('test-key', testValue);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('del', () => {
    it('should handle Redis error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await redisStore.del('test-key');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('should handle Redis error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await redisStore.reset();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when no client', async () => {
      const store = new RedisStore(mockOptions);

      await expect(store.disconnect()).resolves.not.toThrow();
    });
  });
});
