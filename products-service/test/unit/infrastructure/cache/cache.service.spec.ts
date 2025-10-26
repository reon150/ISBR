import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '@infrastructure/cache/cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { getConfig } from '@infrastructure/config';
import { mockLoggerService, mockCacheManager, mockConfigService } from '../../../mocks';

// Mock the getConfig function
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    cache: {
      ttl: {
        products: 300,
      },
    },
  }),
}));

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LOGGER_SERVICE,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
    configService = module.get(ConfigService);
    logger = module.get(LOGGER_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const cachedValue = { id: '1', name: 'Test Product' };
      cacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get('test-key');

      expect(result).toEqual(cachedValue);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(logger.log).toHaveBeenCalledWith('Cache HIT for key: test-key');
    });

    it('should return null when key does not exist', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith('non-existent-key');
      expect(logger.log).toHaveBeenCalledWith('Cache MISS for key: non-existent-key');
    });

    it('should return null and log warning when cache error occurs', async () => {
      const error = new Error('Cache connection failed');
      cacheManager.get.mockRejectedValue(error);

      const result = await service.get('error-key');

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith('error-key');
      expect(logger.warn).toHaveBeenCalledWith(
        'Cache get error for key error-key:',
        'Cache connection failed',
      );
    });

    it('should handle non-Error objects in error handling', async () => {
      cacheManager.get.mockRejectedValue('String error');

      const result = await service.get('error-key');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Cache get error for key error-key:',
        'String error',
      );
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const value = { id: '1', name: 'Test Product' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', value, 300);
      expect(logger.log).toHaveBeenCalledWith('Cache SET for key: test-key (TTL: 300s)');
    });

    it('should set value with custom TTL', async () => {
      const value = { id: '1', name: 'Test Product' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value, 600);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', value, 600);
      expect(logger.log).toHaveBeenCalledWith('Cache SET for key: test-key (TTL: 600s)');
    });

    it('should log warning when cache set error occurs', async () => {
      const value = { id: '1', name: 'Test Product' };
      const error = new Error('Cache set failed');
      cacheManager.set.mockRejectedValue(error);

      await service.set('error-key', value);

      expect(cacheManager.set).toHaveBeenCalledWith('error-key', value, 300);
      expect(logger.warn).toHaveBeenCalledWith(
        'Cache set error for key error-key:',
        'Cache set failed',
      );
    });
  });

  describe('del', () => {
    it('should delete key successfully', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.del('test-key');

      expect(cacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should log warning when cache delete error occurs', async () => {
      const error = new Error('Cache delete failed');
      cacheManager.del.mockRejectedValue(error);

      await service.del('error-key');

      expect(cacheManager.del).toHaveBeenCalledWith('error-key');
      expect(logger.warn).toHaveBeenCalledWith(
        'Cache delete error for key error-key:',
        'Cache delete failed',
      );
    });
  });

  describe('reset', () => {
    it('should reset cache successfully', async () => {
      cacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
    });

    it('should log warning when cache reset error occurs', async () => {
      const error = new Error('Cache reset failed');
      cacheManager.reset.mockRejectedValue(error);

      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Cache reset error:', 'Cache reset failed');
    });
  });
});
