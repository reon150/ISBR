import {
  BusinessException,
  NotFoundException,
  AlreadyExistsException,
  ValidationException,
  InsufficientStockException,
  ForbiddenException,
  UnauthorizedException,
  BusinessRuleViolationException,
  ExternalServiceException,
  InvalidStateException,
} from '@domain/shared/exceptions/business.exceptions';
import { ErrorCode } from '@domain/shared/constants/error-codes';

describe('Business Exceptions', () => {
  describe('BusinessException', () => {
    it('should create exception with default values', () => {
      const exception = new NotFoundException('Test');

      expect(exception.message).toBe('Test not found');
      expect(exception.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(exception.statusCode).toBe(404);
      expect(exception.details).toBeDefined();
      expect(exception.name).toBe('NotFoundException');
    });

    it('should create exception with custom values', () => {
      const details = { field: 'test' };
      const exception = new ValidationException('Test error', ErrorCode.VALIDATION_ERROR, details);

      expect(exception.message).toBe('Test error');
      expect(exception.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(exception.statusCode).toBe(400);
      expect(exception.details).toEqual(details);
    });

    it('should serialize to JSON correctly', () => {
      const exception = new NotFoundException('Test');
      const json = exception.toJSON();

      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code', ErrorCode.RESOURCE_NOT_FOUND);
      expect(json.error).toHaveProperty('message', 'Test not found');
      expect(json.error).toHaveProperty('timestamp');
      expect(json.error).toHaveProperty('details');
    });
  });

  describe('NotFoundException', () => {
    it('should create not found exception with resource only', () => {
      const exception = new NotFoundException('Product');

      expect(exception.message).toBe('Product not found');
      expect(exception.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(exception.statusCode).toBe(404);
    });

    it('should create not found exception with resource and identifier', () => {
      const exception = new NotFoundException('Product', '123');

      expect(exception.message).toBe("Product with identifier '123' not found");
      expect(exception.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(exception.statusCode).toBe(404);
    });

    it('should create not found exception with custom code and details', () => {
      const details = { custom: 'data' };
      const exception = new NotFoundException('User', '456', ErrorCode.PRODUCT_NOT_FOUND, details);

      expect(exception.message).toBe("User with identifier '456' not found");
      expect(exception.code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
      expect(exception.statusCode).toBe(404);
      expect(exception.details).toEqual({
        resource: 'User',
        identifier: '456',
        custom: 'data',
      });
    });
  });

  describe('AlreadyExistsException', () => {
    it('should create already exists exception', () => {
      const exception = new AlreadyExistsException('Product', '123');

      expect(exception.message).toBe("Product with identifier '123' already exists");
      expect(exception.code).toBe(ErrorCode.RESOURCE_ALREADY_EXISTS);
      expect(exception.statusCode).toBe(409);
      expect(exception.details).toEqual({
        resource: 'Product',
        identifier: '123',
      });
    });

    it('should create already exists exception with custom code and details', () => {
      const details = { custom: 'data' };
      const exception = new AlreadyExistsException(
        'User',
        '456',
        ErrorCode.PRODUCT_ALREADY_EXISTS,
        details,
      );

      expect(exception.message).toBe("User with identifier '456' already exists");
      expect(exception.code).toBe(ErrorCode.PRODUCT_ALREADY_EXISTS);
      expect(exception.statusCode).toBe(409);
      expect(exception.details).toEqual({
        resource: 'User',
        identifier: '456',
        custom: 'data',
      });
    });
  });

  describe('ValidationException', () => {
    it('should create validation exception', () => {
      const exception = new ValidationException('Invalid input');

      expect(exception.message).toBe('Invalid input');
      expect(exception.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(exception.statusCode).toBe(400);
    });

    it('should create validation exception with custom code and details', () => {
      const details = { field: 'email' };
      const exception = new ValidationException(
        'Email is required',
        ErrorCode.VALIDATION_ERROR,
        details,
      );

      expect(exception.message).toBe('Email is required');
      expect(exception.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(exception.statusCode).toBe(400);
      expect(exception.details).toEqual(details);
    });
  });

  describe('InsufficientStockException', () => {
    it('should create insufficient stock exception', () => {
      const exception = new InsufficientStockException('Product A', 10, 5);

      expect(exception.message).toBe(
        'Insufficient stock for Product A. Requested: 10, Available: 5',
      );
      expect(exception.code).toBe(ErrorCode.INSUFFICIENT_STOCK);
      expect(exception.statusCode).toBe(400);
      expect(exception.details).toEqual({
        productName: 'Product A',
        requested: 10,
        available: 5,
      });
    });

    it('should create insufficient stock exception with custom code and details', () => {
      const details = { warehouse: 'Main' };
      const exception = new InsufficientStockException(
        'Product B',
        20,
        15,
        ErrorCode.INSUFFICIENT_STOCK,
        details,
      );

      expect(exception.message).toBe(
        'Insufficient stock for Product B. Requested: 20, Available: 15',
      );
      expect(exception.code).toBe(ErrorCode.INSUFFICIENT_STOCK);
      expect(exception.statusCode).toBe(400);
      expect(exception.details).toEqual({
        productName: 'Product B',
        requested: 20,
        available: 15,
        warehouse: 'Main',
      });
    });
  });

  describe('ForbiddenException', () => {
    it('should create forbidden exception', () => {
      const exception = new ForbiddenException('Access denied');

      expect(exception.message).toBe('Access denied');
      expect(exception.code).toBe(ErrorCode.FORBIDDEN);
      expect(exception.statusCode).toBe(403);
    });

    it('should create forbidden exception with custom code and details', () => {
      const details = { role: 'user' };
      const exception = new ForbiddenException(
        'Admin access required',
        ErrorCode.FORBIDDEN,
        details,
      );

      expect(exception.message).toBe('Admin access required');
      expect(exception.code).toBe(ErrorCode.FORBIDDEN);
      expect(exception.statusCode).toBe(403);
      expect(exception.details).toEqual(details);
    });
  });

  describe('UnauthorizedException', () => {
    it('should create unauthorized exception with default message', () => {
      const exception = new UnauthorizedException();

      expect(exception.message).toBe('Unauthorized');
      expect(exception.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(exception.statusCode).toBe(401);
    });

    it('should create unauthorized exception with custom message', () => {
      const exception = new UnauthorizedException('Invalid token');

      expect(exception.message).toBe('Invalid token');
      expect(exception.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(exception.statusCode).toBe(401);
    });

    it('should create unauthorized exception with custom code and details', () => {
      const details = { token: 'expired' };
      const exception = new UnauthorizedException('Token expired', ErrorCode.UNAUTHORIZED, details);

      expect(exception.message).toBe('Token expired');
      expect(exception.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(exception.statusCode).toBe(401);
      expect(exception.details).toEqual(details);
    });
  });

  describe('BusinessRuleViolationException', () => {
    it('should create business rule violation exception', () => {
      const exception = new BusinessRuleViolationException('Cannot delete active product');

      expect(exception.message).toBe('Business rule violation: Cannot delete active product');
      expect(exception.code).toBe(ErrorCode.BUSINESS_RULE_VIOLATION);
      expect(exception.statusCode).toBe(422);
      expect(exception.details).toEqual({
        rule: 'Cannot delete active product',
      });
    });

    it('should create business rule violation exception with custom code and details', () => {
      const details = { context: 'inventory' };
      const exception = new BusinessRuleViolationException(
        'Stock cannot be negative',
        ErrorCode.BUSINESS_RULE_VIOLATION,
        details,
      );

      expect(exception.message).toBe('Business rule violation: Stock cannot be negative');
      expect(exception.code).toBe(ErrorCode.BUSINESS_RULE_VIOLATION);
      expect(exception.statusCode).toBe(422);
      expect(exception.details).toEqual({
        rule: 'Stock cannot be negative',
        context: 'inventory',
      });
    });
  });

  describe('ExternalServiceException', () => {
    it('should create external service exception', () => {
      const exception = new ExternalServiceException('Payment Gateway');

      expect(exception.message).toBe("External service 'Payment Gateway' is unavailable");
      expect(exception.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(exception.statusCode).toBe(503);
      expect(exception.details).toEqual({
        service: 'Payment Gateway',
      });
    });

    it('should create external service exception with custom code and details', () => {
      const details = { timeout: 5000 };
      const exception = new ExternalServiceException(
        'Email Service',
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        details,
      );

      expect(exception.message).toBe("External service 'Email Service' is unavailable");
      expect(exception.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(exception.statusCode).toBe(503);
      expect(exception.details).toEqual({
        service: 'Email Service',
        timeout: 5000,
      });
    });
  });

  describe('InvalidStateException', () => {
    it('should create invalid state exception', () => {
      const exception = new InvalidStateException('DRAFT', 'PUBLISHED');

      expect(exception.message).toBe("Cannot transition from 'DRAFT' to 'PUBLISHED'");
      expect(exception.code).toBe(ErrorCode.INVALID_STATE_TRANSITION);
      expect(exception.statusCode).toBe(400);
      expect(exception.details).toEqual({
        currentState: 'DRAFT',
        attemptedState: 'PUBLISHED',
      });
    });

    it('should create invalid state exception with custom code and details', () => {
      const details = { reason: 'Missing approval' };
      const exception = new InvalidStateException(
        'PENDING',
        'APPROVED',
        ErrorCode.INVALID_STATE_TRANSITION,
        details,
      );

      expect(exception.message).toBe("Cannot transition from 'PENDING' to 'APPROVED'");
      expect(exception.code).toBe(ErrorCode.INVALID_STATE_TRANSITION);
      expect(exception.statusCode).toBe(400);
      expect(exception.details).toEqual({
        currentState: 'PENDING',
        attemptedState: 'APPROVED',
        reason: 'Missing approval',
      });
    });
  });
});
