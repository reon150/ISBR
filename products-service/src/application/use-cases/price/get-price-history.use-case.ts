import { Inject, Injectable } from '@nestjs/common';
import {
  IPriceHistoryRepository,
  PRICE_HISTORY_REPOSITORY,
  PaginationOptions,
} from '../../../domain/repositories/price-history.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { PriceHistory } from '../../../domain/entities/price-history.entity';
import { Product } from '../../../domain/entities/product.entity';
import { PaginatedResult } from '../../../domain/shared/types';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';
import { Currency } from '../../../domain/shared/enums';
import {
  IExchangeRateService,
  EXCHANGE_RATE_SERVICE,
} from '../../../domain/services/exchange-rate.service.interface';

@Injectable()
export class GetPriceHistoryUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRICE_HISTORY_REPOSITORY)
    private readonly priceHistoryRepository: IPriceHistoryRepository,
    @Inject(EXCHANGE_RATE_SERVICE)
    private readonly exchangeRateService: IExchangeRateService,
  ) {}

  async execute(
    productId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PriceHistory>> {
    const product: Product | null = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product', productId, ErrorCode.PRODUCT_NOT_FOUND);
    }

    const result: PaginatedResult<PriceHistory> =
      await this.priceHistoryRepository.findByProductIdPaginated(productId, options);

    if (options.currency && options.currency !== product.currency) {
      const { convertedAmount: rate } = await this.exchangeRateService.convertPrice(
        1,
        product.currency as Currency,
        options.currency as Currency,
      );

      result.data = result.data.map((entry: PriceHistory): PriceHistory => {
        const convertedEntry: PriceHistory = new PriceHistory();
        convertedEntry.id = entry.id;
        convertedEntry.productId = entry.productId;
        convertedEntry.oldPrice = Math.round(entry.oldPrice * rate * 100) / 100;
        convertedEntry.newPrice = Math.round(entry.newPrice * rate * 100) / 100;
        convertedEntry.createdAt = entry.createdAt;
        convertedEntry.createdBy = entry.createdBy;
        return convertedEntry;
      });
    }

    return result;
  }
}
