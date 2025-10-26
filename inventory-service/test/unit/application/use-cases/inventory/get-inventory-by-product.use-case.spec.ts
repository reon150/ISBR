import { Test, TestingModule } from '@nestjs/testing';
import { GetInventoryByProductIdUseCase } from '@application/use-cases/inventory/get-inventory-by-product.use-case';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '@domain/repositories/inventory.repository.interface';
import { Inventory } from '@domain/entities/inventory.entity';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';
import { mockInventory, mockInventoryRepository } from '../../../../mocks';

describe('GetInventoryByProductIdUseCase', () => {
  let useCase: GetInventoryByProductIdUseCase;
  let inventoryRepository: jest.Mocked<IInventoryRepository>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInventoryByProductIdUseCase,
        {
          provide: INVENTORY_REPOSITORY,
          useValue: mockInventoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetInventoryByProductIdUseCase>(GetInventoryByProductIdUseCase);
    inventoryRepository = module.get(INVENTORY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return inventory when found', async () => {
    inventoryRepository.findByProductId.mockResolvedValue(mockInventory);

    const result = await useCase.execute('product-1');

    expect(result).toEqual(mockInventory);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
  });

  it('should throw NotFoundException when inventory not found', async () => {
    inventoryRepository.findByProductId.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent-product')).rejects.toThrow(NotFoundException);
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('nonexistent-product');
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    inventoryRepository.findByProductId.mockRejectedValue(error);

    await expect(useCase.execute('product-1')).rejects.toThrow('Database error');
    expect(inventoryRepository.findByProductId).toHaveBeenCalledWith('product-1');
  });
});
