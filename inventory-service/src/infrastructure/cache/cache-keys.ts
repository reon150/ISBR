export const CACHE_KEYS: {
  INVENTORY_ALL: () => string;
  INVENTORY_BY_ID: (id: string) => string;
  INVENTORY_BY_PRODUCT: (productId: string) => string;
  INVENTORY_BY_SKU: (sku: string) => string;
  INVENTORY_LOW_STOCK: () => string;
} = {
  INVENTORY_ALL: () => 'inventory:all',
  INVENTORY_BY_ID: (id: string) => `inventory:id:${id}`,
  INVENTORY_BY_PRODUCT: (productId: string) => `inventory:product:${productId}`,
  INVENTORY_BY_SKU: (sku: string) => `inventory:sku:${sku}`,
  INVENTORY_LOW_STOCK: () => 'inventory:lowstock',
};
