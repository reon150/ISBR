import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryRepository } from '@infrastructure/database/repositories/inventory.repository';
import { Inventory } from '@domain/entities/inventory.entity';
import { MovementType } from '@domain/shared/enums';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';

// Mock Data
const mockInventory: Inventory = {
  id: '1',
  productId: 'product-1',
  quantity: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  deletedAt: new Date(),
  deletedBy: '',
  movements: [],
  adjustQuantity: jest.fn(),
  delete: jest.fn(),
  isDeleted: jest.fn().mockReturnValue(false),
} as Inventory;

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let typeOrmRepository: jest.Mocked<Repository<Inventory>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        {
          provide: getRepositoryToken(Inventory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            merge: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<InventoryRepository>(InventoryRepository);
    typeOrmRepository = module.get(getRepositoryToken(Inventory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new inventory record', async () => {
      const inventoryData = {
        productId: 'product-1',
        quantity: 50,
        productSku: 'SKU-001',
        productName: 'Test Product',
      };

      typeOrmRepository.create.mockReturnValue(mockInventory);
      typeOrmRepository.save.mockResolvedValue(mockInventory);

      const result = await repository.create(inventoryData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(inventoryData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockInventory);
      expect(result).toBe(mockInventory);
    });
  });

  describe('findAll', () => {
    it('should return all active inventory records ordered by creation date', async () => {
      const inventories = [mockInventory];
      typeOrmRepository.find.mockResolvedValue(inventories);

      const result = await repository.findAll();

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(inventories);
    });
  });

  describe('findById', () => {
    it('should return an inventory record by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockInventory);

      const result = await repository.findById('1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBe(mockInventory);
    });

    it('should return null when inventory not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByProductId', () => {
    it('should return inventory by product id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockInventory);

      const result = await repository.findByProductId('product-1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          productId: 'product-1',
          deletedAt: expect.anything(),
        },
      });
      expect(result).toBe(mockInventory);
    });

    it('should return null when inventory not found by product id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByProductId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an inventory record successfully', async () => {
      const updateData = { quantity: 75 };
      const updatedInventory: Inventory = {
        ...mockInventory,
        quantity: 75,
      } as Inventory;

      typeOrmRepository.findOne.mockResolvedValue(mockInventory);
      typeOrmRepository.merge.mockReturnValue(updatedInventory);
      typeOrmRepository.save.mockResolvedValue(updatedInventory);

      const result = await repository.update('1', updateData);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(typeOrmRepository.merge).toHaveBeenCalledWith(mockInventory, updateData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(updatedInventory);
      expect(result).toBe(updatedInventory);
    });

    it('should throw NotFoundException when inventory not found', async () => {
      const updateData = { quantity: 75 };

      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('999', updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an inventory record', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('1');

      expect(typeOrmRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('save', () => {
    it('should save an inventory record', async () => {
      typeOrmRepository.save.mockResolvedValue(mockInventory);

      const result = await repository.save(mockInventory);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockInventory);
      expect(result).toBe(mockInventory);
    });
  });
});
