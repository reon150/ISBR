export const mockProductRepository: jest.Mocked<any> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySku: jest.fn(),
  findByCategory: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
};

export const mockPriceHistoryRepository: jest.Mocked<any> = {
  create: jest.fn(),
  findByProductId: jest.fn(),
  findByProductIdPaginated: jest.fn(),
  findByProductIdAndDateRange: jest.fn(),
  deleteByProductId: jest.fn(),
  save: jest.fn(),
};

export const mockUserRepository: jest.Mocked<any> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

export const mockCategoryRepository: jest.Mocked<any> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
