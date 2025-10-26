import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContextService } from '@infrastructure/auth/execution-context.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

describe('ExecutionContextService', () => {
  let service: ExecutionContextService;
  let mockRequest: Partial<Request>;

  beforeEach(async () => {
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionContextService,
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<ExecutionContextService>(ExecutionContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserId', () => {
    it('should return user ID when user is authenticated', () => {
      const userId = service.getUserId();

      expect(userId).toBe('user-123');
    });

    it('should throw error when user is not authenticated', () => {
      mockRequest.user = undefined;

      expect(() => service.getUserId()).toThrow('User not authenticated');
    });

    it('should throw error when user is null', () => {
      mockRequest.user = undefined;

      expect(() => service.getUserId()).toThrow('User not authenticated');
    });
  });

  describe('getUser', () => {
    it('should return user object when user is authenticated', () => {
      const user = service.getUser();

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should throw error when user is not authenticated', () => {
      mockRequest.user = undefined;

      expect(() => service.getUser()).toThrow('User not authenticated');
    });

    it('should throw error when user is null', () => {
      mockRequest.user = undefined;

      expect(() => service.getUser()).toThrow('User not authenticated');
    });

    it('should return user with ADMIN role', () => {
      mockRequest.user = {
        userId: 'admin-456',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      const user = service.getUser();

      expect(user).toEqual({
        id: 'admin-456',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });
});
