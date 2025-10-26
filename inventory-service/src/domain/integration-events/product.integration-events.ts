export interface ProductCreatedEvent extends Record<string, unknown> {
  productId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currency: string;
  timestamp: Date;
}

export interface ProductUpdatedEvent extends Record<string, unknown> {
  productId: string;
  changes: {
    name?: string;
    price?: number;
    category?: string;
    [key: string]: unknown;
  };
  timestamp: Date;
}

export interface ProductDeletedEvent extends Record<string, unknown> {
  productId: string;
  sku: string;
  deletedBy: string;
  timestamp: Date;
}
