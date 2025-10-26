import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from '@presentation/controllers/inventory.controller';
import {
  AdjustInventoryUseCase,
  GetInventoryByProductIdUseCase,
} from '@application/use-cases/inventory';
import { GetMovementHistoryUseCase } from '@application/use-cases/movement';
import { Logger } from '@nestjs/common';
import { MovementType } from '@domain/shared/enums';
import { Inventory } from '@domain/entities/inventory.entity';
import { InventoryMovement } from '@domain/entities/inventory-movement.entity';
import { AdjustInventoryCommand } from '@domain/commands/inventory.commands';
import { InventoryMovementResponseDto, InventoryResponseDto } from '../../../../src/presentation/dto/inventory';
import { PaginatedResponseDto } from '../../../../src/presentation/dto/shared/pagination.dto';

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
  inventory: {} as Inventory,
  type: 'IN' as MovementType,
  quantity: 10,
  quantityBefore: 50,
  quantityAfter: 60,
  reason: 'Test adjustment',
  reference: 'REF-001',
  createdAt: new Date(),
  createdBy: 'user-1',
  metadata: {},
} as InventoryMovement;

describe('InventoryController', () => {
  let controller: InventoryController;
  let adjustInventoryUseCase: jest.Mocked<AdjustInventoryUseCase>;
  let getInventoryByProductIdUseCase: jest.Mocked<GetInventoryByProductIdUseCase>;
  let getMovementHistoryUseCase: jest.Mocked<GetMovementHistoryUseCase>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: AdjustInventoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetInventoryByProductIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMovementHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    adjustInventoryUseCase = module.get(AdjustInventoryUseCase);
    getInventoryByProductIdUseCase = module.get(GetInventoryByProductIdUseCase);
    getMovementHistoryUseCase = module.get(GetMovementHistoryUseCase);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('adjustInventory', () => {
    it('should adjust inventory successfully', async () => {
      const adjustDto: {
        productId: string;
        type: MovementType;
        quantity: number;
        reason: string;
        reference: string;
      } = {
        productId: 'product-1',
        type: MovementType.IN,
        quantity: 10,
        reason: 'Stock received',
        reference: 'REF-001',
      };

      adjustInventoryUseCase.execute.mockResolvedValue(mockInventory);

      const result: InventoryResponseDto = await controller.adjustInventory(adjustDto);

      expect(adjustInventoryUseCase.execute).toHaveBeenCalledWith(
        expect.any(AdjustInventoryCommand),
      );
      expect(result).toBeDefined();
      expect(logger.log).toHaveBeenCalledWith(
        `Starting inventory adjustment for productId: ${adjustDto.productId}, type: ${adjustDto.type}, quantity: ${adjustDto.quantity}`,
      );
    });

    it('should handle adjustment errors', async () => {
      const adjustDto: {
        productId: string;
        type: MovementType;
        quantity: number;
        reason: string;
        reference: string;
      } = {
        productId: 'product-1',
        type: MovementType.OUT,
        quantity: 100,
        reason: 'Stock sold',
        reference: 'REF-002',
      };

      const error: Error = new Error('Insufficient stock');
      adjustInventoryUseCase.execute.mockRejectedValue(error);

      await expect(controller.adjustInventory(adjustDto)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getInventory', () => {
    it('should return inventory by product id', async () => {
      getInventoryByProductIdUseCase.execute.mockResolvedValue(mockInventory);

      const result: InventoryResponseDto = await controller.getInventory('product-1');

      expect(getInventoryByProductIdUseCase.execute).toHaveBeenCalledWith('product-1');
      expect(result).toBeDefined();
      expect(logger.log).toHaveBeenCalledWith('Fetching inventory for productId: product-1');
    });

    it('should handle not found errors', async () => {
      const error: Error = new Error('Inventory not found');
      getInventoryByProductIdUseCase.execute.mockRejectedValue(error);

      await expect(controller.getInventory('non-existent')).rejects.toThrow('Inventory not found');
    });
  });

  describe('getMovements', () => {
    it('should return movement history for a product', async () => {
      const movements: { data: InventoryMovement[]; total: number } = {
        data: [mockInventoryMovement],
        total: 1,
      };
      getMovementHistoryUseCase.execute.mockResolvedValue(movements);

      const result: PaginatedResponseDto<InventoryMovementResponseDto> =
        await controller.getMovements('product-1');

      expect(getMovementHistoryUseCase.execute).toHaveBeenCalledWith('product-1', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(logger.log).toHaveBeenCalledWith(
        'Fetching movement history for productId: product-1 - Page: 1, Limit: 10',
      );
    });

    it('should return empty array when no movements found', async () => {
      getMovementHistoryUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      const result: PaginatedResponseDto<InventoryMovementResponseDto> =
        await controller.getMovements('product-1');

      expect(result.data).toHaveLength(0);
    });
  });
});
