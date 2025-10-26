import { Product } from '@domain/entities/product.entity';
import { Category } from '@domain/entities/category.entity';
import { PriceHistory } from '@domain/entities/price-history.entity';
import { Currency } from '@domain/shared/enums';

export const mockProduct: Product = {
  id: '1',
  sku: 'TEST-SKU-001',
  name: 'Test Product',
  description: 'Test Description',
  price: 100.0,
  currency: Currency.USD,
  categoryId: 'cat-1',
  category: {} as Category,
  stockQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  deletedAt: new Date(),
  deletedBy: '',
  priceHistory: [],
  updatePrice: jest.fn(),
  updateStock: jest.fn(),
  delete: jest.fn(),
  isDeleted: jest.fn().mockReturnValue(false),
  canBeDeleted: jest.fn().mockReturnValue(true),
} as Product;

export const mockCategory: Category = {
  id: 'cat-1',
  name: 'Test Category',
  description: 'Test Category Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  deletedAt: undefined,
  deletedBy: undefined,
  products: [],
};

export const mockPriceHistory: PriceHistory[] = [
  {
    id: '1',
    productId: '1',
    product: mockProduct,
    oldPrice: 90,
    newPrice: 100,
    createdBy: 'user-1',
    createdAt: new Date(),
  },
  {
    id: '2',
    productId: '1',
    product: mockProduct,
    oldPrice: 80,
    newPrice: 90,
    createdBy: 'user-1',
    createdAt: new Date(),
  },
];
