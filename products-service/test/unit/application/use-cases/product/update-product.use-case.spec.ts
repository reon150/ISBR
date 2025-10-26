import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProductUseCase } from '@application/use-cases/product/update-product.use-case';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@domain/repositories/product.repository.interface';
import {
  IPriceHistoryRepository,
  PRICE_HISTORY_REPOSITORY,
} from '@domain/repositories/price-history.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@domain/repositories/category.repository.interface';
import {
  IExecutionContext,
  EXECUTION_CONTEXT,
} from '@domain/shared/interfaces/execution-context.interface';
import { Product } from '@domain/entities/product.entity';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';
import { UpdateProductCommand } from '@domain/commands/product.commands';
import {
  mockProduct,
  mockProductRepository,
  mockPriceHistoryRepository,
  mockExecutionContext,
} from '../../../../mocks';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let productRepository: jest.Mocked<IProductRepository>;
  let priceHistoryRepository: jest.Mocked<IPriceHistoryRepository>;
  let executionContext: jest.Mocked<IExecutionContext>;

  const mockCategoryRepository: jest.Mocked<ICategoryRepository> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: PRICE_HISTORY_REPOSITORY,
          useValue: mockPriceHistoryRepository,
        },
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockCategoryRepository,
        },
        {
          provide: EXECUTION_CONTEXT,
          useValue: mockExecutionContext,
        },
      ],
    }).compile();

    useCase = module.get<UpdateProductUseCase>(UpdateProductUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    priceHistoryRepository = module.get(PRICE_HISTORY_REPOSITORY);
    executionContext = module.get(EXECUTION_CONTEXT);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update product successfully', async () => {
    const updatedProduct = {
      ...mockProduct,
      name: 'Updated Product',
      price: 150.0,
      updatePrice: jest.fn(),
      updateStock: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      canBeDeleted: jest.fn().mockReturnValue(true),
    };
    productRepository.findById.mockResolvedValue(mockProduct);
    productRepository.update.mockResolvedValue(updatedProduct);
    priceHistoryRepository.create.mockResolvedValue({} as any);

    const command = new UpdateProductCommand('1', 'Updated Product', undefined, undefined, 150.0);

    const result = await useCase.execute(command);

    expect(result).toEqual(updatedProduct);
    expect(productRepository.findById).toHaveBeenCalledWith('1');
    expect(productRepository.update).toHaveBeenCalledWith('1', {
      name: 'Updated Product',
      description: undefined,
      categoryId: undefined,
      price: 150.0,
      currency: undefined,
      updatedBy: 'user-1',
    });
    expect(priceHistoryRepository.create).toHaveBeenCalledWith({
      productId: '1',
      oldPrice: 100.0,
      newPrice: 150.0,
      createdBy: 'user-1',
    });
  });

  it('should update product without price change', async () => {
    const updatedProduct = {
      ...mockProduct,
      name: 'Updated Product',
      updatePrice: jest.fn(),
      updateStock: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      canBeDeleted: jest.fn().mockReturnValue(true),
    };
    productRepository.findById.mockResolvedValue(mockProduct);
    productRepository.update.mockResolvedValue(updatedProduct);

    const command = new UpdateProductCommand('1', 'Updated Product');

    const result = await useCase.execute(command);

    expect(result).toEqual(updatedProduct);
    expect(productRepository.findById).toHaveBeenCalledWith('1');
    expect(productRepository.update).toHaveBeenCalledWith('1', {
      name: 'Updated Product',
      description: undefined,
      categoryId: undefined,
      price: undefined,
      currency: undefined,
      updatedBy: 'user-1',
    });
    expect(priceHistoryRepository.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when product not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    const command = new UpdateProductCommand('999', 'Updated Product');

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
    expect(productRepository.findById).toHaveBeenCalledWith('999');
    expect(productRepository.update).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    productRepository.findById.mockRejectedValue(error);

    const command = new UpdateProductCommand('1', 'Updated Product');

    await expect(useCase.execute(command)).rejects.toThrow('Database error');
    expect(productRepository.findById).toHaveBeenCalledWith('1');
  });
});
