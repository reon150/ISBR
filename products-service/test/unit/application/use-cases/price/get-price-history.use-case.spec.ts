import { Test, TestingModule } from '@nestjs/testing';
import { GetPriceHistoryUseCase } from '@application/use-cases/price/get-price-history.use-case';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@domain/repositories/product.repository.interface';
import {
  IPriceHistoryRepository,
  PRICE_HISTORY_REPOSITORY,
} from '@domain/repositories/price-history.repository.interface';
import {
  IExchangeRateService,
  EXCHANGE_RATE_SERVICE,
} from '@domain/services/exchange-rate.service.interface';
import { NotFoundException } from '@domain/shared/exceptions';
import {
  mockProduct,
  mockProductRepository,
  mockPriceHistoryRepository,
  mockPriceHistory,
} from '../../../../mocks';

describe('GetPriceHistoryUseCase', () => {
  let useCase: GetPriceHistoryUseCase;
  let productRepository: jest.Mocked<IProductRepository>;
  let priceHistoryRepository: jest.Mocked<IPriceHistoryRepository>;
  let exchangeRateService: jest.Mocked<IExchangeRateService>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const mockExchangeRateService: jest.Mocked<IExchangeRateService> = {
      convertPrice: jest.fn().mockResolvedValue({ convertedAmount: 100, rate: 1 }),
      getExchangeRate: jest.fn().mockResolvedValue(1),
      getAllRates: jest.fn().mockResolvedValue({
        base: 'USD',
        rates: { EUR: 0.85, DOP: 55 },
        timestamp: Date.now(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPriceHistoryUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: PRICE_HISTORY_REPOSITORY,
          useValue: mockPriceHistoryRepository,
        },
        {
          provide: EXCHANGE_RATE_SERVICE,
          useValue: mockExchangeRateService,
        },
      ],
    }).compile();

    useCase = module.get<GetPriceHistoryUseCase>(GetPriceHistoryUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    priceHistoryRepository = module.get(PRICE_HISTORY_REPOSITORY);
    exchangeRateService = module.get(EXCHANGE_RATE_SERVICE);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return price history when product exists', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      priceHistoryRepository.findByProductIdPaginated.mockResolvedValue({
        data: mockPriceHistory,
        total: mockPriceHistory.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      const result = await useCase.execute('1', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockPriceHistory);
      expect(productRepository.findById).toHaveBeenCalledWith('1');
      expect(priceHistoryRepository.findByProductIdPaginated).toHaveBeenCalledWith('1', {
        page: 1,
        limit: 10,
      });
    });

    it('should return empty array when product exists but has no price history', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      priceHistoryRepository.findByProductIdPaginated.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });

      const result = await useCase.execute('1', { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(productRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('999', { page: 1, limit: 10 })).rejects.toThrow(
        NotFoundException,
      );
      expect(productRepository.findById).toHaveBeenCalledWith('999');
      expect(priceHistoryRepository.findByProductIdPaginated).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException with correct error code when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      try {
        await useCase.execute('999', { page: 1, limit: 10 });
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toBe(
          "Product with identifier '999' not found",
        );
      }
    });
  });
});
