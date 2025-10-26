import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  findAll(page?: number, limit?: number): Promise<{ data: Category[]; total: number }>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  create(category: Partial<Category>): Promise<Category>;
  update(id: string, category: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
}

export const CATEGORY_REPOSITORY: string = 'CATEGORY_REPOSITORY';
