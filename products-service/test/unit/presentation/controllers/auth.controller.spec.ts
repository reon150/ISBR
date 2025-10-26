import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@presentation/controllers/auth.controller';
import { AuthService } from '@application/services/auth';
import { UserRole } from '@domain/shared/enums';

// Mock Data
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
};

const mockAuthResponse = {
  access_token: 'mock-jwt-token',
  user: mockUser,
};

const mockRegisterDto = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

const mockLoginDto = {
  email: 'test@example.com',
  password: 'password123',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            isTokenBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(mockRegisterDto);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
    });

    it('should handle registration errors', async () => {
      const error = new Error('User already exists');
      authService.register.mockRejectedValue(error);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockRequest = {
        user: mockUser,
      };

      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(mockRequest);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toBeDefined();
      expect(result.access_token).toBe(mockAuthResponse.access_token);
    });

    it('should handle login errors', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const error = new Error('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await expect(controller.login(mockRequest)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockAuthHeader = 'Bearer mock-token';
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      const result = await controller.logout(mockAuthHeader);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('mock-token');
    });
  });
});
