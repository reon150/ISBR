import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '@infrastructure/external/exchange-rate/exchange-rate.service';
import { ConfigService } from '@nestjs/config';
import { ICacheService, CACHE_SERVICE } from '@domain/services/cache.service.interface';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import { Currency } from '@domain/shared/enums';
import { ExternalServiceException } from '@domain/shared/exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn(() => ({
    exchangeRate: {
      apiUrl: 'https://v6.exchangerate-api.com/v6',
      apiKey: 'test-api-key',
    },
    cache: {
      ttl: {
        exchangeRates: 3600,
      },
    },
  })),
}));

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  let cacheService: jest.Mocked<ICacheService>;
  let loggerService: jest.Mocked<ILoggerService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CACHE_SERVICE,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
    cacheService = module.get(CACHE_SERVICE);
    loggerService = module.get(LOGGER_SERVICE);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExchangeRate', () => {
    it('should return 1 when from and to currencies are the same', async () => {
      const rate = await service.getExchangeRate(Currency.USD, Currency.USD);
      expect(rate).toBe(1);
    });

    it('should return cached rate when available', async () => {
      const cachedRates = {
        base: Currency.USD,
        rates: { EUR: 0.85, GBP: 0.73 },
        timestamp: Date.now(),
      };

      cacheService.get.mockResolvedValue(cachedRates);

      const rate = await service.getExchangeRate(Currency.USD, Currency.EUR);

      expect(rate).toBe(0.85);
      expect(cacheService.get).toHaveBeenCalledWith('exchange_rates:USD');
      expect(loggerService.log).toHaveBeenCalledWith('Returning cached exchange rates for USD');
    });

    it('should fetch rate from mock when not cached', async () => {
      cacheService.get.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: {
          result: 'success',
          conversion_rates: {
            USD: 1,
            DOP: 55.0,
            EUR: 0.92,
            CAD: 1.35,
            GBP: 0.79,
          },
          time_last_update_unix: Math.floor(Date.now() / 1000),
          time_next_update_unix: Math.floor(Date.now() / 1000) + 3600,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const rate = await service.getExchangeRate(Currency.USD, Currency.EUR);

      expect(rate).toBe(0.92);
      expect(cacheService.set).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalled();
    });
  });

  describe('convertPrice', () => {
    it('should convert price using exchange rate', async () => {
      const cachedRates = {
        base: Currency.USD,
        rates: { EUR: 0.85 },
        timestamp: Date.now(),
      };

      cacheService.get.mockResolvedValue(cachedRates);

      const result = await service.convertPrice(100, Currency.USD, Currency.EUR);

      expect(result.convertedAmount).toBe(85);
      expect(result.rate).toBe(0.85);
    });
  });

  describe('getAllRates', () => {
    it('should return cached rates when available', async () => {
      const cachedRates = {
        base: Currency.USD,
        rates: { EUR: 0.85, GBP: 0.73 },
        timestamp: Date.now(),
      };

      cacheService.get.mockResolvedValue(cachedRates);

      const result = await service.getAllRates(Currency.USD);

      expect(result).toEqual(cachedRates);
      expect(loggerService.log).toHaveBeenCalledWith('Returning cached exchange rates for USD');
    });

    it('should fetch rates from API when not cached', async () => {
      cacheService.get.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: {
          result: 'success',
          conversion_rates: {
            USD: 1,
            DOP: 55.0,
            EUR: 0.92,
            CAD: 1.35,
            GBP: 0.79,
          },
          time_last_update_unix: Math.floor(Date.now() / 1000),
          time_next_update_unix: Math.floor(Date.now() / 1000) + 3600,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await service.getAllRates(Currency.USD);

      expect(result.base).toBe(Currency.USD);
      expect(result.rates).toEqual({
        USD: 1,
        DOP: 55,
        EUR: 0.92,
        CAD: 1.35,
        GBP: 0.79,
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalled();
    });
  });
});
