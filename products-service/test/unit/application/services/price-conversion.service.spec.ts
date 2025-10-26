import { Test, TestingModule } from '@nestjs/testing';
import { PriceConversionService } from '@application/services/price-conversion.service';
import {
  IExchangeRateService,
  EXCHANGE_RATE_SERVICE,
} from '@domain/services/exchange-rate.service.interface';
import { Currency } from '@domain/shared/enums';
import { mockProduct, mockExchangeRateService } from '../../../mocks';

describe('PriceConversionService', () => {
  let service: PriceConversionService;
  let exchangeRateService: jest.Mocked<IExchangeRateService>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceConversionService,
        {
          provide: EXCHANGE_RATE_SERVICE,
          useValue: mockExchangeRateService,
        },
      ],
    }).compile();

    service = module.get<PriceConversionService>(PriceConversionService);
    exchangeRateService = module.get(EXCHANGE_RATE_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return same product when currencies are the same', async () => {
    const result: any = await service.convertProductPrice(mockProduct, Currency.USD);

    expect(result).toEqual(mockProduct);
    expect(exchangeRateService.convertPrice).not.toHaveBeenCalled();
  });

  it('should convert product price to different currency', async () => {
    exchangeRateService.convertPrice.mockResolvedValue({
      convertedAmount: 85.0,
      rate: 0.85,
    });

    const result: any = await service.convertProductPrice(mockProduct, Currency.EUR);

    expect(result.price).toBe(85.0);
    expect(result.currency).toBe(Currency.EUR);
    expect(exchangeRateService.convertPrice).toHaveBeenCalledWith(
      100.0,
      Currency.USD,
      Currency.EUR,
    );
  });

  it('should convert multiple products prices', async () => {
    const products: any[] = [
      mockProduct,
      {
        ...mockProduct,
        id: '2',
        price: 200.0,
        updatePrice: jest.fn(),
        updateStock: jest.fn(),
        deactivate: jest.fn(),
        activate: jest.fn(),
        canBeDeleted: jest.fn().mockReturnValue(true),
      },
    ];
    exchangeRateService.convertPrice
      .mockResolvedValueOnce({ convertedAmount: 85.0, rate: 0.85 })
      .mockResolvedValueOnce({ convertedAmount: 170.0, rate: 0.85 });

    const result: any = await service.convertProductsPrices(products, Currency.EUR);

    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(85.0);
    expect(result[0].currency).toBe(Currency.EUR);
    expect(result[1].price).toBe(170.0);
    expect(result[1].currency).toBe(Currency.EUR);
    expect(exchangeRateService.convertPrice).toHaveBeenCalledTimes(2);
  });

  it('should handle exchange rate service errors', async () => {
    const error: Error = new Error('Exchange rate service error');
    exchangeRateService.convertPrice.mockRejectedValue(error);

    await expect(service.convertProductPrice(mockProduct, Currency.EUR)).rejects.toThrow(
      'Exchange rate service error',
    );
  });
});
