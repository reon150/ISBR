import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CategoryRepository } from '@infrastructure/database/repositories/category.repository';
import { Category } from '@domain/entities/category.entity';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let typeOrmRepository: jest.Mocked<Repository<Category>>;

  const mockCategory: Category = {
    id: '1',
    name: 'Test Category',
    description: 'Test Description',
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
      providers: [
        CategoryRepository,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findAndCount: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
    typeOrmRepository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories without pagination', async () => {
      typeOrmRepository.find.mockResolvedValue([mockCategory]);

      const result = await repository.findAll();

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { name: 'ASC' },
      });
      expect(result.data).toEqual([mockCategory]);
      expect(result.total).toBe(1);
    });

    it('should return paginated categories', async () => {
      typeOrmRepository.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await repository.findAll(1, 10);

      expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual([mockCategory]);
      expect(result.total).toBe(1);
    });

    it('should calculate skip correctly for page 2', async () => {
      typeOrmRepository.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await repository.findAll(2, 10);

      expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { name: 'ASC' },
        skip: 10,
        take: 10,
      });
      expect(result.data).toEqual([mockCategory]);
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockCategory);

      const result = await repository.findById('1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: IsNull() },
      });
      expect(result).toBe(mockCategory);
    });

    it('should return null when category not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a category by name', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockCategory);

      const result = await repository.findByName('Test Category');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Test Category', deletedAt: IsNull() },
      });
      expect(result).toBe(mockCategory);
    });

    it('should return null when category not found by name', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByName('Non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const categoryData = { name: 'New Category', description: 'New Description' };

      typeOrmRepository.create.mockReturnValue(mockCategory);
      typeOrmRepository.save.mockResolvedValue(mockCategory);

      const result = await repository.create(categoryData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(categoryData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toBe(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const updatedCategory = { ...mockCategory, name: 'Updated Category' };

      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(updatedCategory);

      const result = await repository.update('1', { name: 'Updated Category' });

      expect(typeOrmRepository.update).toHaveBeenCalledWith('1', { name: 'Updated Category' });
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: IsNull() },
      });
      expect(result).toBe(updatedCategory);
    });

    it('should throw error when category not found after update', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('999', { name: 'Updated' })).rejects.toThrow(
        'Category not found after update',
      );
    });
  });

  describe('delete', () => {
    it('should delete a category (soft delete)', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('1');

      expect(typeOrmRepository.update).toHaveBeenCalledWith('1', {
        deletedAt: expect.any(Date),
        deletedBy: 'system',
      });
    });
  });
});

