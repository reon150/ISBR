import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from '../../../domain/entities/category.entity';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  async findAll(page?: number, limit?: number): Promise<{ data: Category[]; total: number }> {
    if (page !== undefined && limit !== undefined) {
      const [data, total] = await this.repository.findAndCount({
        where: { deletedAt: IsNull() },
        order: { name: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { data, total };
    }

    const data: Category[] = await this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
    return { data, total: data.length };
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({ where: { name, deletedAt: IsNull() } });
  }

  async create(category: Partial<Category>): Promise<Category> {
    const newCategory: Category = this.repository.create(category);
    return this.repository.save(newCategory);
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    await this.repository.update(id, category);
    const updatedCategory: Category | null = await this.findById(id);
    if (!updatedCategory) {
      throw new Error('Category not found after update');
    }
    return updatedCategory;
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, {
      deletedAt: new Date(),
      deletedBy: 'system',
    });
  }
}
