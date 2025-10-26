import { ErrorCode } from '../constants/error-codes';

export abstract class BusinessException extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export class NotFoundException extends BusinessException {
  constructor(
    resource: string,
    identifier?: string,
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    details?: Record<string, unknown>,
  ) {
    const message: string = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    const errorDetails: Record<string, unknown> = {
      resource,
      identifier,
      ...details,
    };

    super(message, code, 404, errorDetails);
  }
}

export class AlreadyExistsException extends BusinessException {
  constructor(
    resource: string,
    identifier: string,
    code: ErrorCode = ErrorCode.RESOURCE_ALREADY_EXISTS,
    details?: Record<string, unknown>,
  ) {
    const errorDetails: Record<string, unknown> = {
      resource,
      identifier,
      ...details,
    };

    super(`${resource} with identifier '${identifier}' already exists`, code, 409, errorDetails);
  }
}

export class ValidationException extends BusinessException {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    details?: Record<string, unknown>,
  ) {
    super(message, code, 400, details);
  }
}

export class InsufficientStockException extends BusinessException {
  constructor(
    productName: string,
    requested: number,
    available: number,
    code: ErrorCode = ErrorCode.INSUFFICIENT_STOCK,
    details?: Record<string, unknown>,
  ) {
    const errorDetails: Record<string, unknown> = {
      productName,
      requested,
      available,
      ...details,
    };

    super(
      `Insufficient stock for ${productName}. Requested: ${requested}, Available: ${available}`,
      code,
      400,
      errorDetails,
    );
  }
}

export class ForbiddenException extends BusinessException {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.FORBIDDEN,
    details?: Record<string, unknown>,
  ) {
    super(message, code, 403, details);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(
    message: string = 'Unauthorized',
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    details?: Record<string, unknown>,
  ) {
    super(message, code, 401, details);
  }
}

export class BusinessRuleViolationException extends BusinessException {
  constructor(
    rule: string,
    code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    details?: Record<string, unknown>,
  ) {
    const errorDetails: Record<string, unknown> = {
      rule,
      ...details,
    };

    super(`Business rule violation: ${rule}`, code, 422, errorDetails);
  }
}

export class ExternalServiceException extends BusinessException {
  constructor(
    service: string,
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    details?: Record<string, unknown>,
  ) {
    const errorDetails: Record<string, unknown> = {
      service,
      ...details,
    };

    super(`External service '${service}' is unavailable`, code, 503, errorDetails);
  }
}

export class InvalidStateException extends BusinessException {
  constructor(
    currentState: string,
    attemptedState: string,
    code: ErrorCode = ErrorCode.INVALID_STATE_TRANSITION,
    details?: Record<string, unknown>,
  ) {
    const errorDetails: Record<string, unknown> = {
      currentState,
      attemptedState,
      ...details,
    };

    super(
      `Cannot transition from '${currentState}' to '${attemptedState}'`,
      code,
      400,
      errorDetails,
    );
  }
}
