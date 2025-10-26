import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '@infrastructure/database/repositories/user.repository';
import { User } from '@domain/entities/user.entity';
import { UserRole } from '@domain/shared/enums';

// Mock Data
const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  password: 'hashedPassword',
  name: 'Test User',
  role: UserRole.USER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  hashPassword: jest.fn(),
  validatePassword: jest.fn().mockResolvedValue(true),
  isAdmin: jest.fn().mockReturnValue(false),
};

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: UserRole.USER,
      };

      typeOrmRepository.create.mockReturnValue(mockUser);
      typeOrmRepository.save.mockResolvedValue(mockUser);

      const result = await repository.create(userData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(userData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found by email', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findById('1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a user', async () => {
      typeOrmRepository.save.mockResolvedValue(mockUser);

      const result = await repository.save(mockUser);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });
  });
});
