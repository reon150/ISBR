import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '@presentation/controllers/products.controller';
import {
  CreateProductUseCase,
  GetAllProductsUseCase,
  GetProductByIdUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
} from '@application/use-cases/product';
import { GetPriceHistoryUseCase } from '@application/use-cases/price';
import { Logger } from '@nestjs/common';
import { Currency, UserRole } from '@domain/shared/enums';
import { Product } from '@domain/entities/product.entity';
import { PriceHistory } from '@domain/entities/price-history.entity';
import {
  CreateProductCommand,
  UpdateProductCommand,
  DeleteProductCommand,
} from '@domain/commands/product.commands';
import { plainToInstance } from 'class-transformer';

// Mock Data
const mockProduct: Product = {
  id: '1',
  sku: 'SKU-001',
  name: 'Test Product',
  description: 'Test Description',
  price: 100.0,
  currency: Currency.USD,
  categoryId: 'cat-1',
  category: {} as any,
  stockQuantity: 50,
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

const mockPriceHistory: PriceHistory = {
  id: '1',
  productId: '1',
  product: {} as Product,
  oldPrice: 90.0,
  newPrice: 100.0,
  changeReason: 'Price update',
  createdAt: new Date(),
  createdBy: 'user-1',
};

describe('ProductsController', () => {
  let controller: ProductsController;
  let createProductUseCase: jest.Mocked<CreateProductUseCase>;
  let getAllProductsUseCase: jest.Mocked<GetAllProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;
  let updateProductUseCase: jest.Mocked<UpdateProductUseCase>;
  let deleteProductUseCase: jest.Mocked<DeleteProductUseCase>;
  let getPriceHistoryUseCase: jest.Mocked<GetPriceHistoryUseCase>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: CreateProductUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetAllProductsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetProductByIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateProductUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteProductUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetPriceHistoryUseCase,
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

    controller = module.get<ProductsController>(ProductsController);
    createProductUseCase = module.get(CreateProductUseCase);
    getAllProductsUseCase = module.get(GetAllProductsUseCase);
    getProductByIdUseCase = module.get(GetProductByIdUseCase);
    updateProductUseCase = module.get(UpdateProductUseCase);
    deleteProductUseCase = module.get(DeleteProductUseCase);
    getPriceHistoryUseCase = module.get(GetPriceHistoryUseCase);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createProductDto = {
        sku: 'SKU-001',
        name: 'Test Product',
        description: 'Test Description',
        price: 100.0,
        currency: Currency.USD,
        categoryId: 'cat-1',
        stockQuantity: 50,
      };

      createProductUseCase.execute.mockResolvedValue(mockProduct);

      const result = await controller.create(createProductDto);

      expect(createProductUseCase.execute).toHaveBeenCalledWith(expect.any(CreateProductCommand));
      expect(result).toBeDefined();
      expect(logger.log).toHaveBeenCalledWith(`Creating product: ${createProductDto.name}`);
    });
  });

  describe('findAll', () => {
    it('should return all products without currency conversion', async () => {
      const paginatedResult = { data: [mockProduct], total: 1 };
      getAllProductsUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll();

      expect(getAllProductsUseCase.execute).toHaveBeenCalledWith(undefined, undefined, 1, 10);
      expect(result.data).toHaveLength(1);
    });

    it('should return all products with currency conversion', async () => {
      const paginatedResult = { data: [mockProduct], total: 1 };
      getAllProductsUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ currency: Currency.EUR, page: 1, limit: 10 });

      expect(getAllProductsUseCase.execute).toHaveBeenCalledWith(undefined, Currency.EUR, 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(mockProduct);

      const result = await controller.findOne('1');

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('1', undefined);
      expect(result).toBeDefined();
      expect(logger.log).toHaveBeenCalledWith('Fetching product by id: 1');
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateProductDto = {
        name: 'Updated Product',
        price: 150.0,
      };

      updateProductUseCase.execute.mockResolvedValue(mockProduct);

      const result = await controller.update('1', updateProductDto);

      expect(updateProductUseCase.execute).toHaveBeenCalledWith(expect.any(UpdateProductCommand));
      expect(result).toBeDefined();
      expect(logger.log).toHaveBeenCalledWith('Updating product with id: 1');
    });
  });

  describe('remove', () => {
    it('should delete a product successfully', async () => {
      deleteProductUseCase.execute.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(deleteProductUseCase.execute).toHaveBeenCalledWith(expect.any(DeleteProductCommand));
      expect(logger.log).toHaveBeenCalledWith('Deleting product with id: 1');
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for a product', async () => {
      const paginatedResult = { data: [mockPriceHistory], total: 1 };
      getPriceHistoryUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.getPriceHistory('1', {});

      expect(getPriceHistoryUseCase.execute).toHaveBeenCalledWith('1', {
        page: 1,
        limit: 10,
        startDate: undefined,
        endDate: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(logger.log).toHaveBeenCalledWith('Fetching price history for product id: 1');
    });
  });
});
