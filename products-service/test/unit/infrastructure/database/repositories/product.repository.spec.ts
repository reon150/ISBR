import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRepository } from '@infrastructure/database/repositories/product.repository';
import { Product } from '@domain/entities/product.entity';
import { Currency } from '@domain/shared/enums';
import { NotFoundException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';

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

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let typeOrmRepository: jest.Mocked<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            merge: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<ProductRepository>(ProductRepository);
    typeOrmRepository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const productData = {
        sku: 'SKU-001',
        name: 'Test Product',
        price: 100.0,
      };

      typeOrmRepository.create.mockReturnValue(mockProduct);
      typeOrmRepository.save.mockResolvedValue(mockProduct);

      const result = await repository.create(productData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(productData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toBe(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products ordered by creation date', async () => {
      const products = [mockProduct];
      typeOrmRepository.find.mockResolvedValue(products);

      const result = await repository.findAll();

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ data: products, total: 1 });
      expect(typeOrmRepository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockProduct);
      typeOrmRepository.create.mockReturnValue(mockProduct);

      const result = await repository.findById('1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: expect.anything() },
      });
      expect(result).toBe(mockProduct);
    });

    it('should return null when product not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should return a product by SKU', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockProduct);

      const result = await repository.findBySku('SKU-001');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { sku: 'SKU-001' } });
      expect(result).toBe(mockProduct);
    });

    it('should return null when product not found by SKU', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySku('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateData = { name: 'Updated Product' };
      const updatedProduct: Product = {
        ...mockProduct,
        name: 'Updated Product',
        updatePrice: jest.fn(),
        updateStock: jest.fn(),
        delete: jest.fn(),
        isDeleted: jest.fn().mockReturnValue(false),
        canBeDeleted: jest.fn().mockReturnValue(true),
      } as Product;

      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValueOnce({
        ...mockProduct,
        name: 'Updated Product',
      });
      typeOrmRepository.create.mockReturnValue(updatedProduct);

      const result = await repository.update('1', updateData);

      expect(typeOrmRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: expect.anything() },
      });
      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundException when product not found after update', async () => {
      const updateData = { name: 'Updated Product' };

      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('999', updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('1');

      expect(typeOrmRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('save', () => {
    it('should save a product', async () => {
      typeOrmRepository.save.mockResolvedValue(mockProduct);

      const result = await repository.save(mockProduct);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toBe(mockProduct);
    });
  });
});
