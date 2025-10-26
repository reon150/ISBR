import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CachedInventoryRepository } from '@infrastructure/database/repositories/cached-inventory.repository';
import { InventoryRepository } from '@infrastructure/database/repositories/inventory.repository';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { ICacheService, CACHE_SERVICE } from '@domain/services/cache.service.interface';
import { Inventory } from '@domain/entities/inventory.entity';
import { mockInventory } from '../../../../mocks/domain/entities.mock';
import { mockInventoryRepository } from '../../../../mocks/domain/repositories.mock';
import { mockCacheService } from '../../../../mocks/domain/services.mock';

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

// Mock cache keys
jest.mock('@infrastructure/cache/cache-keys', () => ({
  CACHE_KEYS: {
    INVENTORY_ALL: () => 'inventory:all',
    INVENTORY_BY_ID: (id: string) => `inventory:id:${id}`,
    INVENTORY_BY_PRODUCT: (productId: string) => `inventory:product:${productId}`,
    INVENTORY_BY_SKU: (sku: string) => `inventory:sku:${sku}`,
    INVENTORY_LOW_STOCK: () => 'inventory:low-stock',
  },
}));

describe('CachedInventoryRepository', () => {
  let repository: CachedInventoryRepository;
  let inventoryRepository: jest.Mocked<IInventoryRepository>;
  let cacheService: jest.Mocked<ICacheService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CachedInventoryRepository,
          useFactory: (
            inventoryRepo: InventoryRepository,
            cacheService: ICacheService,
            configService: ConfigService,
          ) => {
            return new CachedInventoryRepository(inventoryRepo, cacheService, configService);
          },
          inject: [InventoryRepository, CACHE_SERVICE, ConfigService],
        },
        {
          provide: InventoryRepository,
          useValue: mockInventoryRepository,
        },
        {
          provide: CACHE_SERVICE,
          useValue: mockCacheService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<CachedInventoryRepository>(CachedInventoryRepository);
    inventoryRepository = module.get(InventoryRepository);
    cacheService = module.get(CACHE_SERVICE);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create inventory and invalidate cache', async () => {
      inventoryRepository.create.mockResolvedValue(mockInventory);
      const result = await repository.create(mockInventory);
      expect(inventoryRepository.create).toHaveBeenCalledWith(mockInventory);
      expect(cacheService.reset).toHaveBeenCalled();
      expect(result).toBe(mockInventory);
    });
  });

  describe('findAll', () => {
    it('should return cached inventories when available', async () => {
      cacheService.get.mockResolvedValue([mockInventory]);
      const result = await repository.findAll();
      expect(cacheService.get).toHaveBeenCalledWith('inventory:all');
      expect(inventoryRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual([mockInventory]);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      cacheService.get.mockResolvedValue(null);
      inventoryRepository.findAll.mockResolvedValue([mockInventory]);
      const result = await repository.findAll();
      expect(cacheService.get).toHaveBeenCalledWith('inventory:all');
      expect(inventoryRepository.findAll).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith('inventory:all', [mockInventory], 300);
      expect(result).toEqual([mockInventory]);
    });
  });

  describe('findById', () => {
    it('should return cached inventory when available', async () => {
      cacheService.get.mockResolvedValue(mockInventory);
      const result = await repository.findById('1');
      expect(cacheService.get).toHaveBeenCalledWith('inventory:id:1');
      expect(inventoryRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockInventory);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      cacheService.get.mockResolvedValue(null);
      inventoryRepository.findById.mockResolvedValue(mockInventory);
      const result = await repository.findById('1');
      expect(cacheService.get).toHaveBeenCalledWith('inventory:id:1');
      expect(inventoryRepository.findById).toHaveBeenCalledWith('1');
      expect(cacheService.set).toHaveBeenCalledWith('inventory:id:1', mockInventory, 300);
      expect(result).toBe(mockInventory);
    });

    it('should return null when inventory not found', async () => {
      cacheService.get.mockResolvedValue(null);
      inventoryRepository.findById.mockResolvedValue(null);
      const result = await repository.findById('999');
      expect(cacheService.get).toHaveBeenCalledWith('inventory:id:999');
      expect(inventoryRepository.findById).toHaveBeenCalledWith('999');
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByProductId', () => {
    it('should return cached inventory when available', async () => {
      cacheService.get.mockResolvedValue(mockInventory);
      const result = await repository.findByProductId('product-1');
      expect(cacheService.get).toHaveBeenCalledWith('inventory:product:product-1');
      expect(inventoryRepository.findByProductId).not.toHaveBeenCalled();
      expect(result).toEqual(mockInventory);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      cacheService.get.mockResolvedValue(null);
      inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
      const result = await repository.findByProductId('product-1');
      expect(cacheService.get).toHaveBeenCalledWith('inventory:product:product-1');
      expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
      expect(cacheService.set).toHaveBeenCalledWith(
        'inventory:product:product-1',
        mockInventory,
        300,
      );
      expect(result).toBe(mockInventory);
    });

    it('should return null when inventory not found', async () => {
      cacheService.get.mockResolvedValue(null);
      inventoryRepository.findByProductId.mockResolvedValue(null);
      const result = await repository.findByProductId('non-existent-product');
      expect(cacheService.get).toHaveBeenCalledWith('inventory:product:non-existent-product');
      expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('non-existent-product');
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update inventory and invalidate cache', async () => {
      inventoryRepository.update.mockResolvedValue(mockInventory);
      const result = await repository.update('1', { quantity: 100 });
      expect(inventoryRepository.update).toHaveBeenCalledWith('1', { quantity: 100 });
      expect(cacheService.reset).toHaveBeenCalled();
      expect(result).toBe(mockInventory);
    });
  });

  describe('save', () => {
    it('should save inventory and invalidate cache', async () => {
      inventoryRepository.save.mockResolvedValue(mockInventory);
      const result = await repository.save(mockInventory);
      expect(inventoryRepository.save).toHaveBeenCalledWith(mockInventory);
      expect(cacheService.reset).toHaveBeenCalled();
      expect(result).toBe(mockInventory);
    });
  });

  describe('delete', () => {
    it('should delete inventory and invalidate cache', async () => {
      inventoryRepository.delete.mockResolvedValue(undefined);
      await repository.delete('1');
      expect(inventoryRepository.delete).toHaveBeenCalledWith('1');
      expect(cacheService.reset).toHaveBeenCalled();
    });
  });
});
