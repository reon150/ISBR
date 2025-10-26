import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { ICacheService, CACHE_SERVICE } from '../../../domain/services/cache.service.interface';
import { CACHE_KEYS } from '../../cache/cache-keys';
import { getConfig, AppConfiguration } from '../../config';

@Injectable()
export class CachedInventoryRepository implements IInventoryRepository {
  private readonly cacheTtl: number;

  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    private readonly configService: ConfigService,
  ) {
    const config: AppConfiguration = getConfig(this.configService);
    this.cacheTtl = config.cache.ttl.inventory;
  }

  private createInventoryInstance(data: Record<string, unknown>): Inventory {
    const inventory: Inventory = new Inventory();
    Object.assign(inventory, data);
    if (typeof data.quantity === 'string' || typeof data.quantity === 'number') {
      inventory.quantity =
        typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity;
    }
    return inventory;
  }

  async create(inventory: Partial<Inventory>): Promise<Inventory> {
    const result: Inventory = await this.inventoryRepository.create(inventory);
    await this.invalidateCache();
    return result;
  }

  async findAll(): Promise<Inventory[]> {
    const cacheKey: string = CACHE_KEYS.INVENTORY_ALL();
    const cached: Record<string, unknown>[] | null =
      await this.cacheService.get<Record<string, unknown>[]>(cacheKey);

    if (cached) {
      return cached.map((item: Record<string, unknown>) => this.createInventoryInstance(item));
    }

    const inventories: Inventory[] = await this.inventoryRepository.findAll();
    await this.cacheService.set(cacheKey, inventories, this.cacheTtl);

    return inventories;
  }

  async findById(id: string): Promise<Inventory | null> {
    const cacheKey: string = CACHE_KEYS.INVENTORY_BY_ID(id);
    const cached: Record<string, unknown> | null =
      await this.cacheService.get<Record<string, unknown>>(cacheKey);

    if (cached) {
      return this.createInventoryInstance(cached);
    }

    const inventory: Inventory | null = await this.inventoryRepository.findById(id);

    if (inventory) {
      await this.cacheService.set(cacheKey, inventory, this.cacheTtl);
    }

    return inventory;
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    const cacheKey: string = CACHE_KEYS.INVENTORY_BY_PRODUCT(productId);
    const cached: Record<string, unknown> | null =
      await this.cacheService.get<Record<string, unknown>>(cacheKey);

    if (cached) {
      return this.createInventoryInstance(cached);
    }

    const inventory: Inventory | null = await this.inventoryRepository.findByProductId(productId);

    if (inventory) {
      await this.cacheService.set(cacheKey, inventory, this.cacheTtl);
    }

    return inventory;
  }

  async update(id: string, inventory: Partial<Inventory>): Promise<Inventory> {
    const result: Inventory = await this.inventoryRepository.update(id, inventory);
    await this.invalidateCache();
    return result;
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const result: Inventory = await this.inventoryRepository.save(inventory);
    await this.invalidateCache();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.inventoryRepository.delete(id);
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheService.reset();
  }
}
