import { Test, TestingModule } from '@nestjs/testing';
import { GetMovementHistoryUseCase } from '@application/use-cases/movement/get-movement-history.use-case';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '@domain/repositories/inventory.repository.interface';
import {
  IInventoryMovementRepository,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '@domain/repositories/inventory-movement.repository.interface';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';
import { MovementType } from '@domain/shared/constants';
import {
  mockInventory,
  mockInventoryMovement,
  mockInventoryRepository,
  mockInventoryMovementRepository,
} from '../../../../mocks';

describe('GetMovementHistoryUseCase', () => {
  let useCase: GetMovementHistoryUseCase;
  let inventoryRepository: jest.Mocked<IInventoryRepository>;
  let movementRepository: jest.Mocked<IInventoryMovementRepository>;

  const mockMovements = { data: [mockInventoryMovement], total: 1 };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMovementHistoryUseCase,
        {
          provide: INVENTORY_REPOSITORY,
          useValue: mockInventoryRepository,
        },
        {
          provide: INVENTORY_MOVEMENT_REPOSITORY,
          useValue: mockInventoryMovementRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetMovementHistoryUseCase>(GetMovementHistoryUseCase);
    inventoryRepository = module.get(INVENTORY_REPOSITORY);
    movementRepository = module.get(INVENTORY_MOVEMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return movement history for existing inventory', async () => {
    inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
    movementRepository.findByInventoryId.mockResolvedValue(mockMovements);

    const result = await useCase.execute('product-1');

    expect(result).toEqual(mockMovements);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
    expect(movementRepository.findByInventoryId).toHaveBeenCalledWith('1', 1, 10);
  });

  it('should return empty array when no movements found', async () => {
    inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
    movementRepository.findByInventoryId.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute('product-1');

    expect(result).toEqual({ data: [], total: 0 });
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
    expect(movementRepository.findByInventoryId).toHaveBeenCalledWith('1', 1, 10);
  });

  it('should throw NotFoundException when inventory not found', async () => {
    inventoryRepository.findByProductId.mockResolvedValue(null);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('non-existent');
    expect(movementRepository.findByInventoryId).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    inventoryRepository.findByProductId.mockRejectedValue(error);

    await expect(useCase.execute('product-1')).rejects.toThrow('Database error');
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
  });
});
