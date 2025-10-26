import { Test, TestingModule } from '@nestjs/testing';
import { CreateProductUseCase } from '@application/use-cases/product/create-product.use-case';
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
import { ProductEventPublisher } from '@infrastructure/messaging/product-event-publisher.service';
import { Product } from '@domain/entities/product.entity';
import { Category } from '@domain/entities/category.entity';
import { Currency } from '@domain/shared/enums';
import { AlreadyExistsException } from '@domain/shared/exceptions';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
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
    deletedAt: new Date(),
    deletedBy: '',
    priceHistory: [],
    updatePrice: jest.fn(),
    updateStock: jest.fn(),
    delete: jest.fn(),
    isDeleted: jest.fn().mockReturnValue(false),
    canBeDeleted: jest.fn().mockReturnValue(true),
  } as Product;

  // Mock Repositories
  const mockProductRepository: jest.Mocked<any> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  const mockPriceHistoryRepository: jest.Mocked<any> = {
    create: jest.fn(),
    findByProductId: jest.fn(),
    findByProductIdAndDateRange: jest.fn(),
    deleteByProductId: jest.fn(),
  };

  // Mock Services
  const mockExecutionContext: jest.Mocked<any> = {
    getUserId: jest.fn().mockReturnValue('user-1'),
    getCurrentUserId: jest.fn().mockReturnValue('user-1'),
    getCurrentTimestamp: jest.fn().mockReturnValue(new Date()),
  };

  const mockProductEventPublisher: jest.Mocked<any> = {
    handleProductCreated: jest.fn(),
    handleProductUpdated: jest.fn(),
    handleProductDeleted: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
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
        {
          provide: ProductEventPublisher,
          useValue: mockProductEventPublisher,
        },
      ],
    }).compile();

    useCase = module.get<CreateProductUseCase>(CreateProductUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    priceHistoryRepository = module.get(PRICE_HISTORY_REPOSITORY);
    executionContext = module.get(EXECUTION_CONTEXT);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create product successfully', async () => {
    productRepository.findBySku.mockResolvedValue(null);
    mockCategoryRepository.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Test Category',
    } as Category);
    productRepository.create.mockResolvedValue(mockProduct);

    const command: any = {
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      description: 'Test Description',
      price: 100.0,
      currency: Currency.USD,
      categoryId: 'cat-1',
    };

    const result: Product = await useCase.execute(command);

    expect(result).toEqual(mockProduct);
    expect(productRepository.findBySku).toHaveBeenCalledWith('TEST-SKU-001');
    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'TEST-SKU-001',
        name: 'Test Product',
        description: 'Test Description',
        price: 100.0,
        currency: Currency.USD,
        categoryId: 'cat-1',
        createdBy: 'user-1',
        updatedBy: 'user-1',
        stockQuantity: 0,
      }),
    );
  });

  it('should throw AlreadyExistsException when product with same SKU exists', async () => {
    productRepository.findBySku.mockResolvedValue(mockProduct);

    const command: any = {
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      description: 'Test Description',
      price: 100.0,
      currency: Currency.USD,
      categoryId: 'cat-1',
    };

    await expect(useCase.execute(command)).rejects.toThrow(AlreadyExistsException);
    expect(productRepository.findBySku).toHaveBeenCalledWith('TEST-SKU-001');
    expect(productRepository.create).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    const error: Error = new Error('Database error');
    productRepository.findBySku.mockRejectedValue(error);

    const command: any = {
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      description: 'Test Description',
      price: 100.0,
      currency: Currency.USD,
      categoryId: 'cat-1',
    };

    await expect(useCase.execute(command)).rejects.toThrow('Database error');
    expect(productRepository.findBySku).toHaveBeenCalledWith('TEST-SKU-001');
  });
});
