import { Test, TestingModule } from '@nestjs/testing';
import { GetAllProductsUseCase } from '@application/use-cases/product/get-all-products.use-case';
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

describe('GetAllProductsUseCase', () => {
  let useCase: GetAllProductsUseCase;
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
    stockQuantity: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedAt: null,
    deletedBy: null,
    priceHistory: [],
    updatePrice: jest.fn(),
    updateStock: jest.fn(),
    delete: jest.fn(),
    isDeleted: jest.fn().mockReturnValue(false),
    canBeDeleted: jest.fn().mockReturnValue(true),
  } as Product;

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
    convertProductsPrices: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllProductsUseCase,
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

    useCase = module.get<GetAllProductsUseCase>(GetAllProductsUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    priceConversionService = module.get(PRICE_CONVERSION_SERVICE);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return all products without currency conversion', async () => {
    const mockPaginated = { data: [mockProduct], total: 1 };
    productRepository.findAll.mockResolvedValue(mockPaginated);

    const result = await useCase.execute(undefined, undefined, 1, 10);

    expect(productRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    expect(result.data).toEqual([mockProduct]);
    expect(result.total).toBe(1);
    expect(priceConversionService.convertProductsPrices).not.toHaveBeenCalled();
  });

  it('should return products with currency conversion', async () => {
    const mockPaginated = { data: [mockProduct], total: 1 };
    const convertedProduct = { ...mockProduct, currency: Currency.EUR };
    productRepository.findAll.mockResolvedValue(mockPaginated);
    priceConversionService.convertProductsPrices.mockResolvedValue([convertedProduct]);

    const result = await useCase.execute(undefined, Currency.EUR, 1, 10);

    expect(productRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    expect(priceConversionService.convertProductsPrices).toHaveBeenCalledWith(
      [mockProduct],
      Currency.EUR,
    );
    expect(result.data).toEqual([convertedProduct]);
    expect(result.total).toBe(1);
  });

  it('should filter by category', async () => {
    const mockPaginated = { data: [mockProduct], total: 1 };
    productRepository.findAll.mockResolvedValue(mockPaginated);

    const result = await useCase.execute('Electronics', undefined, 1, 10);

    expect(productRepository.findAll).toHaveBeenCalledWith('Electronics', 1, 10);
    expect(result.total).toBe(1);
  });

  it('should return empty array when no products exist', async () => {
    const mockPaginated = { data: [], total: 0 };
    productRepository.findAll.mockResolvedValue(mockPaginated);

    const result = await useCase.execute(undefined, undefined, 1, 10);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should handle repository errors', async () => {
    const error = new Error('Database error');
    productRepository.findAll.mockRejectedValue(error);

    await expect(useCase.execute()).rejects.toThrow('Database error');
    expect(productRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
