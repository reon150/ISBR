export enum ErrorCode {
  RESOURCE_NOT_FOUND = 1000,
  RESOURCE_ALREADY_EXISTS = 1001,
  PRODUCT_NOT_FOUND = 1002,
  VALIDATION_ERROR = 1003,
  INVALID_STATE_TRANSITION = 1004,
  BUSINESS_RULE_VIOLATION = 1005,
  INSUFFICIENT_STOCK = 1006,
  UNAUTHORIZED = 1007,
  FORBIDDEN = 1008,
  EXTERNAL_SERVICE_ERROR = 1009,
  UNHANDLED_ERROR = 1010,
  PRODUCT_ALREADY_EXISTS = 1011,
  PRICE_HISTORY_NOT_FOUND = 1012,
  EXCHANGE_RATE_NOT_FOUND = 1013,
  EXCHANGE_RATE_API_ERROR = 1014,
  CATEGORY_NOT_FOUND = 1015,
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
  [ErrorCode.PRODUCT_NOT_FOUND]: {
    description: 'The product was not found',
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
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    description: 'A business rule was violated',
    httpStatus: 422,
  },
  [ErrorCode.INSUFFICIENT_STOCK]: {
    description: 'Insufficient stock available for the requested operation',
    httpStatus: 400,
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
  [ErrorCode.PRODUCT_ALREADY_EXISTS]: {
    description: 'A product with the same SKU already exists',
    httpStatus: 409,
  },
  [ErrorCode.PRICE_HISTORY_NOT_FOUND]: {
    description: 'Price history for the product was not found',
    httpStatus: 404,
  },
  [ErrorCode.EXCHANGE_RATE_NOT_FOUND]: {
    description: 'Exchange rate not available for the requested currency pair',
    httpStatus: 503,
  },
  [ErrorCode.EXCHANGE_RATE_API_ERROR]: {
    description: 'Exchange rate API returned an invalid response',
    httpStatus: 502,
  },
  [ErrorCode.CATEGORY_NOT_FOUND]: {
    description: 'The category was not found',
    httpStatus: 404,
  },
};
