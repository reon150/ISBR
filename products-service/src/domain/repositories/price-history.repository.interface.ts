import { PriceHistory } from '../entities/price-history.entity';
import { Currency } from '../shared/enums';

export interface PaginationOptions {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
  currency?: Currency;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPriceHistoryRepository {
  create(priceHistory: Partial<PriceHistory>): Promise<PriceHistory>;
  findByProductId(productId: string): Promise<PriceHistory[]>;
  findByProductIdPaginated(
    productId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PriceHistory>>;
  save(priceHistory: PriceHistory): Promise<PriceHistory>;
}

export const PRICE_HISTORY_REPOSITORY: string = 'PRICE_HISTORY_REPOSITORY';
