import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { NotFoundException } from '../../../domain/shared/exceptions';
import { ErrorCode } from '../../../domain/shared/constants/error-codes';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct: Product = this.repository.create(product);
    return this.repository.save(newProduct);
  }

  async findAll(
    category?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Product[]; total: number }> {
    const whereCondition: Record<string, unknown> = { deletedAt: IsNull() };

    if (category) {
      whereCondition.category = { name: category };
    }

    if (page !== undefined && limit !== undefined) {
      const [data, total] = await this.repository.findAndCount({
        where: whereCondition,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { data, total };
    }

    const data: Product[] = await this.repository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
    return { data, total: data.length };
  }

  async findById(id: string): Promise<Product | null> {
    const product: Product | null = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!product) {
      return null;
    }
    return this.repository.create(product);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repository.findOne({ where: { sku } });
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    await this.repository.update(id, product);
    const updated: Product | null = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('Product', id, ErrorCode.PRODUCT_NOT_FOUND);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async save(product: Product): Promise<Product> {
    return this.repository.save(product);
  }
}
