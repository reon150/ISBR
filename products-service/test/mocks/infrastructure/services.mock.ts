export const mockExecutionContext: jest.Mocked<any> = {
  getUserId: jest.fn().mockReturnValue('user-1'),
  getCurrentUserId: jest.fn().mockReturnValue('user-1'),
  getCurrentTimestamp: jest.fn().mockReturnValue(new Date()),
};

export const mockJwtService: jest.Mocked<any> = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

export const mockLoggerService: jest.Mocked<any> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

export const mockCacheManager: jest.Mocked<any> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
};

export const mockConfigService: jest.Mocked<any> = {
  get: jest.fn().mockReturnValue({
    cache: {
      ttl: {
        products: 300,
      },
    },
  }),
};
