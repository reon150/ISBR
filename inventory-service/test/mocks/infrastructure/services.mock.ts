export const mockExecutionContext: jest.Mocked<any> = {
  getUserId: jest.fn().mockReturnValue('user-1'),
  getCurrentUserId: jest.fn().mockReturnValue('user-1'),
  getCurrentTimestamp: jest.fn().mockReturnValue(new Date()),
};

export const mockInventoryEventPublisher: jest.Mocked<any> = {
  publishInventoryAdjusted: jest.fn().mockResolvedValue(undefined),
  publishInventoryReserved: jest.fn().mockResolvedValue(undefined),
  publishInventoryReleased: jest.fn().mockResolvedValue(undefined),
};

export const mockKafkaService: jest.Mocked<any> = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

export const mockInfrastructureLoggerService: jest.Mocked<any> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
