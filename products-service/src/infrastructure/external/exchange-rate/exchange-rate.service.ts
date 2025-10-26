import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ILoggerService, LOGGER_SERVICE } from '../../../domain/services/logger.service.interface';
import { ConfigService } from '@nestjs/config';
import { ICacheService, CACHE_SERVICE } from '../../../domain/services/cache.service.interface';
import { Currency } from '../../../domain/shared/enums';
import {
  ExchangeRates,
  IExchangeRateService,
} from '../../../domain/services/exchange-rate.service.interface';
import { ExternalServiceException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';
import { getConfig, AppConfiguration } from '../../config';
import { CACHE_KEYS } from '../../cache/cache-keys';

interface ExchangeRateApiResponse {
  result: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
  time_next_update_unix: number;
}

@Injectable()
export class ExchangeRateService implements IExchangeRateService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly cacheTtl: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    @Inject(LOGGER_SERVICE)
    private readonly logger: ILoggerService,
  ) {
    const config: AppConfiguration = getConfig(this.configService);
    this.apiUrl = config.exchangeRate.apiUrl;
    this.apiKey = config.exchangeRate.apiKey;
    this.cacheTtl = config.cache.ttl.exchangeRates;
  }

  async getExchangeRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) {
      return 1;
    }

    const allRates: ExchangeRates = await this.getAllRates(from);
    const rate: number | undefined = allRates.rates[to];

    if (!rate) {
      throw new ExternalServiceException('Exchange Rate API', ErrorCode.EXCHANGE_RATE_NOT_FOUND, {
        from,
        to,
      });
    }

    return rate;
  }

  async convertPrice(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<{ convertedAmount: number; rate: number }> {
    const rate: number = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount: number = amount * rate;

    return {
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rate,
    };
  }

  async getAllRates(baseCurrency: Currency): Promise<ExchangeRates> {
    const cacheKey: string = CACHE_KEYS.EXCHANGE_RATES_ALL(baseCurrency);

    const cachedRates: ExchangeRates | null = await this.cacheService.get<ExchangeRates>(cacheKey);
    if (cachedRates) {
      this.logger.log(`Returning cached exchange rates for ${baseCurrency}`);
      return cachedRates;
    }

    try {
      const response: AxiosResponse<ExchangeRateApiResponse> = await axios.get(
        `${this.apiUrl}/${this.apiKey}/latest/${baseCurrency}`,
      );

      if (response.data && response.data.result === 'success' && response.data.conversion_rates) {
        const timestamp: number = response.data.time_last_update_unix * 1000;
        const nextUpdateTimestamp: number = response.data.time_next_update_unix * 1000;
        const now: number = Date.now();
        const remainingTtl: number = Math.max(Math.floor((nextUpdateTimestamp - now) / 1000), 60);

        const rates: ExchangeRates = {
          base: baseCurrency,
          rates: response.data.conversion_rates,
          timestamp,
        };

        await this.cacheService.set(cacheKey, rates, remainingTtl);

        this.logger.log(
          `Fetched exchange rates for ${baseCurrency} (cached until next update in ${remainingTtl}s)`,
        );

        return rates;
      }

      throw new ExternalServiceException('Exchange Rate API', ErrorCode.EXTERNAL_SERVICE_ERROR, {
        apiResponse: response.data,
        message: 'Invalid API response structure',
      });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching all rates for ${baseCurrency}:`, errorMessage);

      throw error;
    }
  }
}
