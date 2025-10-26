export enum ErrorCode {
  RESOURCE_NOT_FOUND = 1000,
  RESOURCE_ALREADY_EXISTS = 1001,
  INVENTORY_NOT_FOUND = 1002,
  VALIDATION_ERROR = 1003,
  INVALID_STATE_TRANSITION = 1004,
  INSUFFICIENT_STOCK = 1005,
  BUSINESS_RULE_VIOLATION = 1006,
  UNAUTHORIZED = 1007,
  FORBIDDEN = 1008,
  EXTERNAL_SERVICE_ERROR = 1009,
  UNHANDLED_ERROR = 1010,
  INVENTORY_MOVEMENT_NOT_FOUND = 1011,
}

export const ErrorCodeMetadata: Record<ErrorCode, { description: string; httpStatus: number }> = {
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    description: 'The requested resource was not found',
    httpStatus: 404,
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    description: 'A resource with the same identifier already exists',
    httpStatus: 409,
  },
  [ErrorCode.INVENTORY_NOT_FOUND]: {
    description: 'The inventory record was not found',
    httpStatus: 404,
  },

  [ErrorCode.VALIDATION_ERROR]: {
    description: 'Input validation failed',
    httpStatus: 400,
  },
  [ErrorCode.INVALID_STATE_TRANSITION]: {
    description: 'The requested state transition is not allowed',
    httpStatus: 400,
  },

  [ErrorCode.INSUFFICIENT_STOCK]: {
    description: 'Insufficient stock available for the requested operation',
    httpStatus: 400,
  },
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    description: 'A business rule was violated',
    httpStatus: 422,
  },

  [ErrorCode.UNAUTHORIZED]: {
    description: 'Authentication is required',
    httpStatus: 401,
  },
  [ErrorCode.FORBIDDEN]: {
    description: 'You do not have permission to perform this action',
    httpStatus: 403,
  },

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    description: 'An external service is unavailable',
    httpStatus: 503,
  },

  [ErrorCode.UNHANDLED_ERROR]: {
    description: 'An unhandled error occurred',
    httpStatus: 500,
  },
  [ErrorCode.INVENTORY_MOVEMENT_NOT_FOUND]: {
    description: 'Inventory movement history was not found',
    httpStatus: 404,
  },
};
