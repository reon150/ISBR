import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { LOGGER_SERVICE } from '@domain/services/logger.service.interface';

// Mock config
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn(() => ({
    cache: {
      ttl: {
        inventory: 300,
      },
    },
  })),
}));

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;
  let configService: jest.Mocked<ConfigService>;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
    configService = module.get(ConfigService);
    loggerService = module.get(LOGGER_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when found', async () => {
      const cachedValue = { id: '1', name: 'test' };
      cacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get('test-key');

      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(cachedValue);
      expect(loggerService.log).toHaveBeenCalledWith('Cache HIT for key: test-key');
    });

    it('should return null when cache miss', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(loggerService.log).toHaveBeenCalledWith('Cache MISS for key: test-key');
    });

    it('should handle cache errors gracefully', async () => {
      const error = new Error('Cache error');
      cacheManager.get.mockRejectedValue(error);

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Cache get error for key test-key:',
        'Cache error',
      );
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const value = { id: '1', name: 'test' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', value, 300);
      expect(loggerService.log).toHaveBeenCalledWith('Cache SET for key: test-key (TTL: 300s)');
    });

    it('should set value in cache with custom TTL', async () => {
      const value = { id: '1', name: 'test' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value, 600);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', value, 600);
      expect(loggerService.log).toHaveBeenCalledWith('Cache SET for key: test-key (TTL: 600s)');
    });

    it('should handle cache set errors gracefully', async () => {
      const value = { id: '1', name: 'test' };
      const error = new Error('Cache set error');
      cacheManager.set.mockRejectedValue(error);

      await service.set('test-key', value);

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Cache set error for key test-key:',
        'Cache set error',
      );
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      await service.del('test-key');

      expect(cacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache delete errors gracefully', async () => {
      const error = new Error('Cache delete error');
      cacheManager.del.mockRejectedValue(error);

      await service.del('test-key');

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Cache delete error for key test-key:',
        'Cache delete error',
      );
    });
  });
});
