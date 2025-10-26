import { Test, TestingModule } from '@nestjs/testing';
import { GetAllCategoriesUseCase } from '@application/use-cases/category/get-all-categories.use-case';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@domain/repositories/category.repository.interface';
import { Category } from '@domain/entities/category.entity';

describe('GetAllCategoriesUseCase', () => {
  let useCase: GetAllCategoriesUseCase;
  let categoryRepository: jest.Mocked<ICategoryRepository>;

  const mockCategory: Category = {
    id: '1',
    name: 'Electronics',
    description: 'Electronic products',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedAt: null,
    deletedBy: null,
    products: [],
  };

  const mockCategoryRepository: jest.Mocked<ICategoryRepository> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllCategoriesUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAllCategoriesUseCase>(GetAllCategoriesUseCase);
    categoryRepository = module.get(CATEGORY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all categories with default pagination', async () => {
      const result = { data: [mockCategory], total: 1 };
      categoryRepository.findAll.mockResolvedValue(result);

      const categories = await useCase.execute();

      expect(categoryRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(categories).toEqual(result);
    });

    it('should return categories with custom pagination', async () => {
      const result = { data: [mockCategory], total: 1 };
      categoryRepository.findAll.mockResolvedValue(result);

      const categories = await useCase.execute(2, 5);

      expect(categoryRepository.findAll).toHaveBeenCalledWith(2, 5);
      expect(categories).toEqual(result);
    });

    it('should return multiple categories', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: '2', name: 'Clothing' }];
      const result = { data: mockCategories, total: 2 };
      categoryRepository.findAll.mockResolvedValue(result);

      const categories = await useCase.execute(1, 10);

      expect(categories.data).toHaveLength(2);
      expect(categories.total).toBe(2);
    });

    it('should handle empty results', async () => {
      const result = { data: [], total: 0 };
      categoryRepository.findAll.mockResolvedValue(result);

      const categories = await useCase.execute(1, 10);

      expect(categories.data).toHaveLength(0);
      expect(categories.total).toBe(0);
    });
  });
});

