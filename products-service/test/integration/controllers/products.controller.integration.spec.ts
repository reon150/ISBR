import { INestApplication } from '@nestjs/common';
import {
  TestContext,
  setupIntegrationTest,
  tearDownIntegrationTest,
  TestUser,
  TestCategory,
  TestProduct,
} from '../integration-test-helper';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Products Database Integration Tests', () => {
  let app: INestApplication;
  let context: TestContext;
  let dataSource: DataSource;
  let testCategory: TestCategory;
  let testUser: TestUser;

  beforeAll(async () => {
    context = await setupIntegrationTest();
    app = context.app;
    dataSource = context.dataSource;

    // Create test user
    const userRepository = dataSource.getRepository(TestUser);
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await userRepository.save({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      roles: 'admin',
      isActive: true,
      createdBy: 'system',
      updatedBy: 'system',
    });

    // Create test category
    const categoryRepository = dataSource.getRepository(TestCategory);
    testCategory = await categoryRepository.save({
      name: 'Electronics',
      description: 'Electronic devices',
      isActive: true,
      createdBy: testUser.id,
      updatedBy: testUser.id,
    });
  });

  afterAll(async () => {
    await tearDownIntegrationTest(context);
  });

  describe('Database Operations', () => {
    it('should create a new product in database', async () => {
      const productRepository = dataSource.getRepository(TestProduct);

      const productData = {
        sku: 'PROD-001',
        name: 'Test Laptop',
        description: 'A test laptop for integration testing',
        price: 999.99,
        currency: 'USD',
        categoryId: testCategory.id,
        stockQuantity: 10,
        minStockLevel: 5,
        maxStockLevel: 100,
        isActive: true,
        createdBy: testUser.id,
        updatedBy: testUser.id,
      };

      const savedProduct = await productRepository.save(productData);

      expect(savedProduct).toBeDefined();
      expect(savedProduct.id).toBeDefined();
      expect(savedProduct.sku).toBe(productData.sku);
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.price).toBe(productData.price);
      expect(savedProduct.categoryId).toBe(productData.categoryId);
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.updatedAt).toBeDefined();
    });

    it('should find products by category', async () => {
      const productRepository = dataSource.getRepository(TestProduct);

      // Create another product in the same category
      const productData = {
        sku: 'PROD-002',
        name: 'Test Phone',
        description: 'A test phone for integration testing',
        price: 599.99,
        currency: 'USD',
        categoryId: testCategory.id,
        stockQuantity: 5,
        isActive: true,
        createdBy: testUser.id,
        updatedBy: testUser.id,
      };

      await productRepository.save(productData);

      // Find products by category
      const products = await productRepository.find({
        where: { categoryId: testCategory.id },
      });

      expect(products).toBeDefined();
      expect(products.length).toBeGreaterThan(0);
      expect(products.every((p) => p.categoryId === testCategory.id)).toBe(true);
    });

    it('should update product in database', async () => {
      const productRepository = dataSource.getRepository(TestProduct);

      // Create a product
      const productData = {
        sku: 'PROD-003',
        name: 'Test Tablet',
        description: 'A test tablet for integration testing',
        price: 399.99,
        currency: 'USD',
        categoryId: testCategory.id,
        stockQuantity: 8,
        isActive: true,
        createdBy: testUser.id,
        updatedBy: testUser.id,
      };

      const savedProduct = await productRepository.save(productData);

      // Update the product
      const updatedData = {
        ...savedProduct,
        price: 349.99,
        stockQuantity: 12,
        updatedBy: testUser.id,
      };

      // Add a small delay to ensure updatedAt is different
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedProduct = await productRepository.save(updatedData);

      expect(updatedProduct.price).toBe(349.99);
      expect(updatedProduct.stockQuantity).toBe(12);
      expect(updatedProduct.updatedAt.getTime()).toBeGreaterThanOrEqual(
        savedProduct.updatedAt.getTime(),
      );
    });

    it('should soft delete product', async () => {
      const productRepository = dataSource.getRepository(TestProduct);

      // Create a product
      const productData = {
        sku: 'PROD-004',
        name: 'Test Headphones',
        description: 'A test headphones for integration testing',
        price: 199.99,
        currency: 'USD',
        categoryId: testCategory.id,
        stockQuantity: 15,
        isActive: true,
        createdBy: testUser.id,
        updatedBy: testUser.id,
      };

      const savedProduct = await productRepository.save(productData);

      // Soft delete the product
      await productRepository.update(savedProduct.id, {
        deletedAt: new Date(),
        deletedBy: testUser.id,
      });

      // Verify soft delete
      const deletedProduct = await productRepository.findOne({
        where: { id: savedProduct.id },
      });

      expect(deletedProduct?.deletedAt).toBeDefined();
      expect(deletedProduct?.deletedBy).toBe(testUser.id);
    });
  });
});
