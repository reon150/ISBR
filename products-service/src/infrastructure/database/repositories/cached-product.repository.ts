import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ICacheService, CACHE_SERVICE } from '../../../domain/services/cache.service.interface';
import { CACHE_KEYS } from '../../cache/cache-keys';
import { getConfig, AppConfiguration } from '../../config';

@Injectable()
export class CachedProductRepository implements IProductRepository {
  private readonly cacheTtl: number;

  constructor(
    private readonly productRepository: IProductRepository,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    private readonly configService: ConfigService,
  ) {
    const config: AppConfiguration = getConfig(this.configService);
    this.cacheTtl = config.cache.ttl.products;
  }

  async create(product: Partial<Product>): Promise<Product> {
    const result: Product = await this.productRepository.create(product);
    await this.invalidateCache();
    return result;
  }

  async findAll(
    category?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Product[]; total: number }> {
    const cacheKey: string = CACHE_KEYS.PRODUCTS_ALL(category, page, limit);
    const cached: { data: Product[]; total: number } | null = await this.cacheService.get<{
      data: Product[];
      total: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const result: { data: Product[]; total: number } = await this.productRepository.findAll(
      category,
      page,
      limit,
    );
    await this.cacheService.set(cacheKey, result, this.cacheTtl);

    return result;
  }

  async findById(id: string): Promise<Product | null> {
    const cacheKey: string = CACHE_KEYS.PRODUCT_BY_ID(id);
    const cached: Product | null = await this.cacheService.get<Product>(cacheKey);

    if (cached) {
      return cached;
    }

    const product: Product | null = await this.productRepository.findById(id);

    if (product) {
      await this.cacheService.set(cacheKey, product, this.cacheTtl);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const cacheKey: string = CACHE_KEYS.PRODUCT_BY_SKU(sku);
    const cached: Product | null = await this.cacheService.get<Product>(cacheKey);

    if (cached) {
      return cached;
    }

    const product: Product | null = await this.productRepository.findBySku(sku);

    if (product) {
      await this.cacheService.set(cacheKey, product, this.cacheTtl);
    }

    return product;
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const result: Product = await this.productRepository.update(id, product);
    await this.invalidateCache();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.productRepository.delete(id);
    await this.invalidateCache();
  }

  async save(product: Product): Promise<Product> {
    const result: Product = await this.productRepository.save(product);
    await this.invalidateCache();
    return result;
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheService.reset();
  }
}
