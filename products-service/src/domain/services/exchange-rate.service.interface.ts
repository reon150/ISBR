import { Currency } from '../shared/enums';

export interface ExchangeRates {
  base: Currency;
  rates: { [key in Currency]?: number };
  timestamp: number;
}

export interface IExchangeRateService {
  getExchangeRate(from: Currency, to: Currency): Promise<number>;
  convertPrice(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<{ convertedAmount: number; rate: number }>;
  getAllRates(baseCurrency: Currency): Promise<ExchangeRates>;
}

export const EXCHANGE_RATE_SERVICE: string = 'IExchangeRateService';
