import { Injectable, Inject } from '@nestjs/common';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@domain/repositories/category.repository.interface';
import { Category } from '@domain/entities/category.entity';

@Injectable()
export class GetAllCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Category[]; total: number }> {
    return this.categoryRepository.findAll(page, limit);
  }
}
