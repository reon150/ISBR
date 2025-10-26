export const mockPriceConversionService: jest.Mocked<any> = {
  convertPrice: jest.fn(),
  convertProductsPrices: jest.fn(),
};

export const mockExchangeRateService: jest.Mocked<any> = {
  getAllRates: jest.fn(),
  getRate: jest.fn(),
  convertPrice: jest.fn(),
};

export const mockCacheService: jest.Mocked<any> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
};
