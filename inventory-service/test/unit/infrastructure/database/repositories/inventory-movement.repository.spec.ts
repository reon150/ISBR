import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovementRepository } from '@infrastructure/database/repositories/inventory-movement.repository';
import { InventoryMovement } from '@domain/entities/inventory-movement.entity';
import { Inventory } from '@domain/entities/inventory.entity';
import { MovementType } from '@domain/shared/enums';

// Mock Data
const mockInventory: Inventory = {
  id: '1',
  productId: 'product-1',
  quantity: 50,
  reservedQuantity: 0,
  availableQuantity: 50,
  productSku: 'SKU-001',
  productName: 'Test Product',
  minStockLevel: 10,
  maxStockLevel: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  deletedAt: new Date(),
  deletedBy: '',
  movements: [],
  adjustQuantity: jest.fn(),
  isLowStock: jest.fn().mockReturnValue(false),
  delete: jest.fn(),
  isDeleted: jest.fn().mockReturnValue(false),
} as Inventory;

const mockInventoryMovement: InventoryMovement = {
  id: '1',
  inventoryId: '1',
  inventory: mockInventory,
  type: MovementType.IN,
  quantity: 10,
  quantityBefore: 50,
  quantityAfter: 60,
  reason: 'Test adjustment',
  reference: 'REF-001',
  createdAt: new Date(),
  createdBy: 'user-1',
  metadata: {},
} as InventoryMovement;

describe('InventoryMovementRepository', () => {
  let repository: InventoryMovementRepository;
  let typeOrmRepository: jest.Mocked<Repository<InventoryMovement>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementRepository,
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<InventoryMovementRepository>(InventoryMovementRepository);
    typeOrmRepository = module.get(getRepositoryToken(InventoryMovement));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new inventory movement record', async () => {
      const movementData = {
        inventoryId: '1',
        type: MovementType.IN,
        quantity: 10,
        quantityBefore: 50,
        quantityAfter: 60,
        reason: 'Test adjustment',
        createdBy: 'user-1',
      };

      typeOrmRepository.create.mockReturnValue(mockInventoryMovement);
      typeOrmRepository.save.mockResolvedValue(mockInventoryMovement);

      const result = await repository.create(movementData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(movementData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockInventoryMovement);
      expect(result).toBe(mockInventoryMovement);
    });
  });

  describe('findByInventoryId', () => {
    it('should return movements for an inventory ordered by creation date', async () => {
      const movements = [mockInventoryMovement];
      typeOrmRepository.find.mockResolvedValue(movements);

      const result = await repository.findByInventoryId('1');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { inventoryId: '1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ data: movements, total: movements.length });
    });

    it('should return empty array when no movements found', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findByInventoryId('999');

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findById', () => {
    it('should return a movement by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockInventoryMovement);

      const result = await repository.findById('1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBe(mockInventoryMovement);
    });

    it('should return null when movement not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a movement record', async () => {
      typeOrmRepository.save.mockResolvedValue(mockInventoryMovement);

      const result = await repository.save(mockInventoryMovement);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockInventoryMovement);
      expect(result).toBe(mockInventoryMovement);
    });
  });
});
