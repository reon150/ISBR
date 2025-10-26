import { Product } from '../entities/product.entity';

export interface IProductRepository {
  create(product: Partial<Product>): Promise<Product>;
  findAll(
    category?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Product[]; total: number }>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  update(id: string, product: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  save(product: Product): Promise<Product>;
}

export const PRODUCT_REPOSITORY: string = 'PRODUCT_REPOSITORY';
