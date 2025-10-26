import { Inject, Injectable } from '@nestjs/common';
import { Currency } from '../../domain/shared/enums';
import { Product } from '../../domain/entities/product.entity';
import {
  IExchangeRateService,
  EXCHANGE_RATE_SERVICE,
} from '../../domain/services/exchange-rate.service.interface';
import { IPriceConversionService } from '../../domain/services/price-conversion.service.interface';

@Injectable()
export class PriceConversionService implements IPriceConversionService {
  constructor(
    @Inject(EXCHANGE_RATE_SERVICE)
    private readonly exchangeRateService: IExchangeRateService,
  ) {}

  async convertProductPrice(product: Product, targetCurrency: Currency): Promise<Product> {
    if (product.currency === targetCurrency) {
      return product;
    }

    const { convertedAmount } = await this.exchangeRateService.convertPrice(
      product.price,
      product.currency as Currency,
      targetCurrency,
    );

    const convertedProduct: Product = Object.assign(
      Object.create(Object.getPrototypeOf(product) as object),
      product,
    ) as Product;
    convertedProduct.price = convertedAmount;
    convertedProduct.currency = targetCurrency;

    return convertedProduct;
  }

  async convertProductsPrices(products: Product[], targetCurrency: Currency): Promise<Product[]> {
    return Promise.all(
      products.map((product) => this.convertProductPrice(product, targetCurrency)),
    );
  }
}
