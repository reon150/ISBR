import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@application/services/auth/auth.service';
import { IUserRepository, USER_REPOSITORY } from '@domain/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RegisterRequestDto } from '@presentation/dto/auth/request/register-request.dto';
import { UserRole } from '@domain/shared/enums/user-role.enum';
import { mockUser, mockUserRepository, mockJwtService } from '../../../../mocks';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let cacheManager: any;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(USER_REPOSITORY);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterRequestDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      };

      const createdUser: User = {
        id: '2',
        email: registerDto.email,
        password: '$2b$10$hashedpassword',
        name: registerDto.name,
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockReturnValue(false),
      } as User;

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).toEqual(createdUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        role: UserRole.USER,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterRequestDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('registerAdmin', () => {
    it('should register a new admin successfully', async () => {
      const adminUser: User = {
        id: '3',
        email: 'admin@example.com',
        password: '$2b$10$hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockReturnValue(true),
      };

      const registerDto: RegisterRequestDto = {
        email: 'newadmin@example.com',
        password: 'AdminPassword123!',
        name: 'New Admin',
      };

      const createdAdmin: User = {
        id: '4',
        email: registerDto.email,
        password: '$2b$10$hashedpassword',
        name: registerDto.name,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockReturnValue(true),
      } as User;

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(createdAdmin);

      const result = await service.registerAdmin(registerDto, adminUser);

      expect(result).toEqual(createdAdmin);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        role: UserRole.ADMIN,
      });
    });

    it('should throw ForbiddenException when non-admin tries to register admin', async () => {
      const regularUser: User = {
        id: '5',
        email: 'user@example.com',
        password: '$2b$10$hashedpassword',
        name: 'Regular User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockReturnValue(false),
      } as User;

      const registerDto: RegisterRequestDto = {
        email: 'newadmin@example.com',
        password: 'AdminPassword123!',
        name: 'New Admin',
      };

      await expect(service.registerAdmin(registerDto, regularUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when admin email already exists', async () => {
      const adminUser: User = {
        id: '3',
        email: 'admin@example.com',
        password: '$2b$10$hashedpassword',
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
        isAdmin: jest.fn().mockReturnValue(true),
      } as User;

      const registerDto: RegisterRequestDto = {
        email: 'existing@example.com',
        password: 'AdminPassword123!',
        name: 'Existing Admin',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.registerAdmin(registerDto, adminUser)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const userWithInvalidPassword = {
        ...mockUser,
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(false),
        isAdmin: jest.fn().mockReturnValue(false),
      };
      userRepository.findByEmail.mockResolvedValue(userWithInvalidPassword);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      jwtService.sign.mockReturnValue('mock-jwt-token');
      const userData = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      const result = await service.login(userData);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById('999');
      expect(result).toBeNull();
      expect(userRepository.findById).toHaveBeenCalledWith('999');
    });
  });
});
