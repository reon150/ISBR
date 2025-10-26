import { Inject, Injectable } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { Currency } from '../../../domain/shared/enums';
import {
  IPriceConversionService,
  PRICE_CONVERSION_SERVICE,
} from '../../../domain/services/price-conversion.service.interface';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRICE_CONVERSION_SERVICE)
    private readonly priceConversionService: IPriceConversionService,
  ) {}

  async execute(id: string, currency?: Currency): Promise<Product> {
    const product: Product | null = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product', id, ErrorCode.PRODUCT_NOT_FOUND);
    }

    if (currency && currency !== product.currency) {
      return await this.priceConversionService.convertProductPrice(product, currency);
    }

    return product;
  }
}
