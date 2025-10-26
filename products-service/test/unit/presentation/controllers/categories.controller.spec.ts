import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '@presentation/controllers/categories.controller';
import { GetAllCategoriesUseCase } from '@application/use-cases/category';
import { Category } from '@domain/entities/category.entity';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let getAllCategoriesUseCase: jest.Mocked<GetAllCategoriesUseCase>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: GetAllCategoriesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    getAllCategoriesUseCase = module.get(GetAllCategoriesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated categories with default pagination', async () => {
      const paginatedResult = { data: [mockCategory], total: 1 };
      getAllCategoriesUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({});

      expect(getAllCategoriesUseCase.execute).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should return paginated categories with custom pagination', async () => {
      const paginatedResult = { data: [mockCategory], total: 5 };
      getAllCategoriesUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 2, limit: 3 });

      expect(getAllCategoriesUseCase.execute).toHaveBeenCalledWith(2, 3);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should calculate hasNext and hasPrev correctly', async () => {
      const paginatedResult = { data: [mockCategory], total: 25 };
      getAllCategoriesUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle second page with hasPrev true', async () => {
      const paginatedResult = { data: [mockCategory], total: 25 };
      getAllCategoriesUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 2, limit: 10 });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle last page correctly', async () => {
      const paginatedResult = { data: [mockCategory], total: 25 };
      getAllCategoriesUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 3, limit: 10 });

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });
});

