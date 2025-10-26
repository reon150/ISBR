import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PriceHistoryRepository } from '@infrastructure/database/repositories/price-history.repository';
import { PriceHistory } from '@domain/entities/price-history.entity';
import { Product } from '@domain/entities/product.entity';

describe('PriceHistoryRepository', () => {
  let repository: PriceHistoryRepository;
  let typeOrmRepository: jest.Mocked<Repository<PriceHistory>>;

  const mockPriceHistory: PriceHistory = {
    id: '1',
    productId: 'product-1',
    product: {} as Product,
    oldPrice: 100,
    newPrice: 150,
    changeReason: 'Price increase',
    createdAt: new Date(),
    createdBy: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceHistoryRepository,
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PriceHistoryRepository>(PriceHistoryRepository);
    typeOrmRepository = module.get(getRepositoryToken(PriceHistory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new price history', async () => {
      const priceHistoryData = {
        productId: 'product-1',
        oldPrice: 100,
        newPrice: 150,
        changeReason: 'Price update',
        createdBy: 'user-1',
      };

      typeOrmRepository.create.mockReturnValue(mockPriceHistory);
      typeOrmRepository.save.mockResolvedValue(mockPriceHistory);

      const result = await repository.create(priceHistoryData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(priceHistoryData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockPriceHistory);
      expect(result).toBe(mockPriceHistory);
    });
  });

  describe('findByProductId', () => {
    it('should return price history for a product', async () => {
      const mockHistory = [mockPriceHistory];

      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductId('product-1');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('findByProductIdPaginated', () => {
    it('should return paginated price history without date filters', async () => {
      const mockHistory = [mockPriceHistory];
      const options = { page: 1, limit: 10 };

      typeOrmRepository.count.mockResolvedValue(1);
      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductIdPaginated('product-1', options);

      expect(typeOrmRepository.count).toHaveBeenCalledWith({ where: { productId: 'product-1' } });
      expect(result.data).toEqual(mockHistory);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return paginated price history with both start and end dates', async () => {
      const mockHistory = [mockPriceHistory];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const options = { page: 1, limit: 10, startDate, endDate };

      typeOrmRepository.count.mockResolvedValue(1);
      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductIdPaginated('product-1', options);

      expect(typeOrmRepository.count).toHaveBeenCalledWith({
        where: { productId: 'product-1', createdAt: Between(startDate, endDate) },
      });
      expect(result.data).toEqual(mockHistory);
    });

    it('should return paginated price history with only start date', async () => {
      const mockHistory = [mockPriceHistory];
      const startDate = new Date('2024-01-01');
      const options = { page: 1, limit: 10, startDate };

      typeOrmRepository.count.mockResolvedValue(1);
      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductIdPaginated('product-1', options);

      expect(result.data).toEqual(mockHistory);
    });

    it('should return paginated price history with only end date', async () => {
      const mockHistory = [mockPriceHistory];
      const endDate = new Date('2024-12-31');
      const options = { page: 1, limit: 10, endDate };

      typeOrmRepository.count.mockResolvedValue(1);
      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductIdPaginated('product-1', options);

      expect(result.data).toEqual(mockHistory);
    });

    it('should calculate hasNext and hasPrev correctly', async () => {
      const mockHistory = [mockPriceHistory];
      const options = { page: 1, limit: 10 };

      typeOrmRepository.count.mockResolvedValue(15); // 2 pages
      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductIdPaginated('product-1', options);

      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
      expect(result.totalPages).toBe(2);
    });

    it('should handle second page correctly', async () => {
      const mockHistory = [mockPriceHistory];
      const options = { page: 2, limit: 10 };

      typeOrmRepository.count.mockResolvedValue(15);
      typeOrmRepository.find.mockResolvedValue(mockHistory);

      const result = await repository.findByProductIdPaginated('product-1', options);

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });
  });

  describe('save', () => {
    it('should save price history', async () => {
      typeOrmRepository.save.mockResolvedValue(mockPriceHistory);

      const result = await repository.save(mockPriceHistory);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockPriceHistory);
      expect(result).toBe(mockPriceHistory);
    });
  });
});
