export const mockInventoryRepository: jest.Mocked<any> = {
  findByProductId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByProductSku: jest.fn(),
  findLowStock: jest.fn(),
};

export const mockInventoryMovementRepository: jest.Mocked<any> = {
  create: jest.fn(),
  findByInventoryId: jest.fn(),
  findByProductId: jest.fn(),
  findByDateRange: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  deleteByInventoryId: jest.fn(),
};

export const mockProcessedEventRepository: jest.Mocked<any> = {
  isEventProcessed: jest.fn(),
  markAsProcessed: jest.fn(),
  findByEventId: jest.fn(),
  findByEventType: jest.fn(),
  deleteOlderThan: jest.fn(),
};
