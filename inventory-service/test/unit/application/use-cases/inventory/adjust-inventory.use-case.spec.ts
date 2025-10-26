import { Test, TestingModule } from '@nestjs/testing';
import { AdjustInventoryUseCase } from '@application/use-cases/inventory/adjust-inventory.use-case';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '@domain/repositories/inventory.repository.interface';
import {
  IInventoryMovementRepository,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '@domain/repositories/inventory-movement.repository.interface';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '@domain/shared/interfaces/execution-context.interface';
import { InventoryEventPublisher } from '@infrastructure/messaging/inventory-event-publisher.service';
import { AdjustInventoryCommand } from '@domain/commands/inventory.commands';
import { MovementType } from '@domain/shared/constants';
import { NotFoundException, ValidationException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';
import { InventoryMovement } from '@domain/entities/inventory-movement.entity';
import {
  mockInventory,
  mockInventoryRepository,
  mockInventoryMovementRepository,
  mockExecutionContext,
  mockInventoryEventPublisher,
} from '../../../../mocks';

describe('AdjustInventoryUseCase', () => {
  let useCase: AdjustInventoryUseCase;
  let inventoryRepository: jest.Mocked<IInventoryRepository>;
  let movementRepository: jest.Mocked<IInventoryMovementRepository>;
  let executionContext: jest.Mocked<IExecutionContext>;
  let inventoryEventPublisher: jest.Mocked<InventoryEventPublisher>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset mock inventory state
    mockInventory.quantity = 50;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdjustInventoryUseCase,
        {
          provide: INVENTORY_REPOSITORY,
          useValue: mockInventoryRepository,
        },
        {
          provide: INVENTORY_MOVEMENT_REPOSITORY,
          useValue: mockInventoryMovementRepository,
        },
        {
          provide: EXECUTION_CONTEXT,
          useValue: mockExecutionContext,
        },
        {
          provide: InventoryEventPublisher,
          useValue: mockInventoryEventPublisher,
        },
      ],
    }).compile();

    useCase = module.get<AdjustInventoryUseCase>(AdjustInventoryUseCase);
    inventoryRepository = module.get(INVENTORY_REPOSITORY);
    movementRepository = module.get(INVENTORY_MOVEMENT_REPOSITORY);
    executionContext = module.get(EXECUTION_CONTEXT);
    inventoryEventPublisher = module.get(InventoryEventPublisher);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should adjust inventory with IN movement', async () => {
    const updatedInventory = {
      ...mockInventory,
      quantity: 60,
      adjustQuantity: jest.fn(),
      isLowStock: jest.fn().mockReturnValue(false),
      delete: jest.fn(),
      isDeleted: jest.fn().mockReturnValue(false),
    };
    inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
    inventoryRepository.save.mockResolvedValue(updatedInventory);
    movementRepository.create.mockResolvedValue({} as InventoryMovement);
    inventoryEventPublisher.publishInventoryAdjusted.mockResolvedValue(undefined);

    const command = new AdjustInventoryCommand('product-1', MovementType.IN, 10, 'Stock received');

    const result = await useCase.execute(command);

    expect(result).toEqual(updatedInventory);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
    expect(inventoryRepository.save).toHaveBeenCalledWith(mockInventory);
    expect(movementRepository.create).toHaveBeenCalledWith({
      inventoryId: '1',
      type: MovementType.IN,
      quantity: 10,
      quantityBefore: 50,
      quantityAfter: 60,
      reason: 'Stock received',
      reference: undefined,
      createdBy: 'user-1',
    });
    expect(inventoryEventPublisher.publishInventoryAdjusted).toHaveBeenCalled();
  });

  it('should adjust inventory with OUT movement', async () => {
    const updatedInventory = {
      ...mockInventory,
      quantity: 40,
      adjustQuantity: jest.fn(),
      isLowStock: jest.fn().mockReturnValue(false),
      delete: jest.fn(),
      isDeleted: jest.fn().mockReturnValue(false),
    };
    inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
    inventoryRepository.save.mockResolvedValue(updatedInventory);
    movementRepository.create.mockResolvedValue({} as InventoryMovement);
    inventoryEventPublisher.publishInventoryAdjusted.mockResolvedValue(undefined);

    const command = new AdjustInventoryCommand('product-1', MovementType.OUT, 10, 'Stock sold');

    const result = await useCase.execute(command);

    expect(result).toEqual(updatedInventory);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
    expect(inventoryRepository.save).toHaveBeenCalledWith(mockInventory);
    expect(movementRepository.create).toHaveBeenCalledWith({
      inventoryId: '1',
      type: MovementType.OUT,
      quantity: 10,
      quantityBefore: 50,
      quantityAfter: 40,
      reason: 'Stock sold',
      reference: undefined,
      createdBy: 'user-1',
    });
    expect(inventoryEventPublisher.publishInventoryAdjusted).toHaveBeenCalled();
  });

  it('should adjust inventory with IN movement (adjustment)', async () => {
    const updatedInventory = {
      ...mockInventory,
      quantity: 75,
      adjustQuantity: jest.fn(),
      isLowStock: jest.fn().mockReturnValue(false),
      delete: jest.fn(),
      isDeleted: jest.fn().mockReturnValue(false),
    };
    inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
    inventoryRepository.save.mockResolvedValue(updatedInventory);
    movementRepository.create.mockResolvedValue({} as InventoryMovement);
    inventoryEventPublisher.publishInventoryAdjusted.mockResolvedValue(undefined);

    const command = new AdjustInventoryCommand(
      'product-1',
      MovementType.IN,
      75,
      'Physical count adjustment',
    );

    const result = await useCase.execute(command);

    expect(result).toEqual(updatedInventory);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
    expect(inventoryRepository.save).toHaveBeenCalledWith(mockInventory);
    expect(movementRepository.create).toHaveBeenCalledWith({
      inventoryId: '1',
      type: MovementType.IN,
      quantity: 75,
      quantityBefore: 50,
      quantityAfter: 75,
      reason: 'Physical count adjustment',
      reference: undefined,
      createdBy: 'user-1',
    });
    expect(inventoryEventPublisher.publishInventoryAdjusted).toHaveBeenCalled();
  });

  it('should throw NotFoundException when inventory not found', async () => {
    inventoryRepository.findByProductId.mockResolvedValue(null);

    const command = new AdjustInventoryCommand('non-existent', MovementType.IN, 10, 'Test');

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('non-existent');
    expect(inventoryRepository.save).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    inventoryRepository.findByProductId.mockRejectedValue(error);

    const command = new AdjustInventoryCommand('product-1', MovementType.IN, 10, 'Test');

    await expect(useCase.execute(command)).rejects.toThrow('Database error');
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
  });
});
