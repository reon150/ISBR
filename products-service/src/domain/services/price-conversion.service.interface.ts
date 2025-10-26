import { Currency } from '../shared/enums';
import { Product } from '../entities/product.entity';

export interface IPriceConversionService {
  convertProductPrice(product: Product, targetCurrency: Currency): Promise<Product>;
  convertProductsPrices(products: Product[], targetCurrency: Currency): Promise<Product[]>;
}

export const PRICE_CONVERSION_SERVICE: string = 'IPriceConversionService';
