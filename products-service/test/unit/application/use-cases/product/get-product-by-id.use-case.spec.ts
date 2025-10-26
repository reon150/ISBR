import { Test, TestingModule } from '@nestjs/testing';
import { GetProductByIdUseCase } from '@application/use-cases/product/get-product-by-id.use-case';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@domain/repositories/product.repository.interface';
import {
  IPriceConversionService,
  PRICE_CONVERSION_SERVICE,
} from '@domain/services/price-conversion.service.interface';
import { Product } from '@domain/entities/product.entity';
import { Category } from '@domain/entities/category.entity';
import { Currency } from '@domain/shared/enums';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let productRepository: jest.Mocked<IProductRepository>;
  let priceConversionService: jest.Mocked<IPriceConversionService>;

  // Mock Data
  const mockProduct: Product = {
    id: '1',
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    description: 'Test Description',
    price: 100.0,
    currency: Currency.USD,
    categoryId: 'cat-1',
    category: {} as Category,
    isActive: true,
    stockQuantity: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedAt: new Date(),
    deletedBy: '',
    priceHistory: [],
    updatePrice: jest.fn(),
    updateStock: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
    canBeDeleted: jest.fn().mockReturnValue(true),
  };

  // Mock Repositories
  const mockProductRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySku: jest.fn(),
    findByCategory: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Mock Services
  const mockPriceConversionService = {
    convertPrice: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: PRICE_CONVERSION_SERVICE,
          useValue: mockPriceConversionService,
        },
      ],
    }).compile();

    useCase = module.get<GetProductByIdUseCase>(GetProductByIdUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    priceConversionService = module.get(PRICE_CONVERSION_SERVICE);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return product when found', async () => {
    productRepository.findById.mockResolvedValue(mockProduct);

    const result = await useCase.execute('1');

    expect(result).toEqual(mockProduct);
    expect(productRepository.findById).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException when product not found', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
    expect(productRepository.findById).toHaveBeenCalledWith('999');
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    productRepository.findById.mockRejectedValue(error);

    await expect(useCase.execute('1')).rejects.toThrow('Database error');
    expect(productRepository.findById).toHaveBeenCalledWith('1');
  });
});
