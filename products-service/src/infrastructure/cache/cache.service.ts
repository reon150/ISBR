import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppConfiguration, getConfig } from '../config';
import { ICacheService } from '../../domain/services/cache.service.interface';
import { LOGGER_SERVICE } from '../../domain/services/logger.service.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService implements ICacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    @Inject(LOGGER_SERVICE) private readonly logger: LoggerService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const result: T | undefined = await this.cacheManager.get<T>(key);
      if (result) {
        this.logger.log(`Cache HIT for key: ${key}`);
        return result;
      } else {
        this.logger.log(`Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.warn(
        `Cache get error for key ${key}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const config: AppConfiguration = getConfig(this.configService);
    const defaultTtl: number = ttl || config.cache.ttl.products;

    try {
      await this.cacheManager.set(key, value, defaultTtl);
      this.logger.log(`Cache SET for key: ${key} (TTL: ${defaultTtl}s)`);
    } catch (error) {
      this.logger.warn(
        `Cache set error for key ${key}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(
        `Cache delete error for key ${key}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      this.logger.warn(
        'Cache reset error:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
