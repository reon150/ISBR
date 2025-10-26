import { Inject, Injectable } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { Currency } from '../../../domain/shared/enums';
import { PaginatedResult } from '../../../domain/shared/types';
import {
  IPriceConversionService,
  PRICE_CONVERSION_SERVICE,
} from '../../../domain/services/price-conversion.service.interface';

@Injectable()
export class GetAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRICE_CONVERSION_SERVICE)
    private readonly priceConversionService: IPriceConversionService,
  ) {}

  async execute(
    category?: string,
    currency?: Currency,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<Product>> {
    const result: PaginatedResult<Product> = await this.productRepository.findAll(
      category,
      page,
      limit,
    );

    if (currency) {
      const convertedProducts: Product[] = await this.priceConversionService.convertProductsPrices(
        result.data,
        currency,
      );
      return {
        data: convertedProducts,
        total: result.total,
      };
    }

    return result;
  }
}
