export const CACHE_KEYS: {
  readonly PRODUCT_BY_ID: (productId: string) => string;
  readonly PRODUCT_BY_SKU: (sku: string) => string;
  readonly PRODUCTS_ALL: (
    category?: string,
    page?: number,
    limit?: number,
    currency?: string,
  ) => string;
  readonly EXCHANGE_RATE: (from: string, to: string) => string;
  readonly EXCHANGE_RATES_ALL: (baseCurrency: string) => string;
} = {
  PRODUCT_BY_ID: (productId: string): string => `product:id:${productId}`,
  PRODUCT_BY_SKU: (sku: string): string => `product:sku:${sku}`,
  PRODUCTS_ALL: (category?: string, page?: number, limit?: number, currency?: string): string => {
    let key: string = 'products:all';
    if (category) key += `:category:${category}`;
    if (page !== undefined && limit !== undefined) key += `:page:${page}:limit:${limit}`;
    if (currency) key += `:currency:${currency}`;
    return key;
  },
  EXCHANGE_RATE: (from: string, to: string): string => `exchange:rate:${from}:${to}`,
  EXCHANGE_RATES_ALL: (baseCurrency: string): string => `exchange_rates:${baseCurrency}`,
};
