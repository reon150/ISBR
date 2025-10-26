import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { promises as fs } from 'fs';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Mock config
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn(() => ({
    logs: {
      dir: './logs',
      maxErrorLogs: 1000,
    },
  })),
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: jest.Mocked<ConfigService>;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(async () => {
    mockFs = fs as jest.Mocked<typeof fs>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log a message', () => {
      // The LoggerService uses NestJS Logger internally, so we just test that it doesn't throw
      expect(() => service.log('Test message')).not.toThrow();
    });

    it('should log a message with context', () => {
      expect(() => service.log('Test message', 'TestContext')).not.toThrow();
    });
  });

  describe('error', () => {
    it('should log an error message', () => {
      expect(() => service.error('Test error')).not.toThrow();
    });

    it('should log an error with trace and context', () => {
      expect(() => service.error('Test error', 'Error trace', 'TestContext')).not.toThrow();
    });

    it('should log an error with details', () => {
      const details = {
        errorCode: 'TEST_ERROR',
        requestId: 'req-123',
        metadata: { userId: 'user-1' },
      };

      expect(() =>
        service.error('Test error', 'Error trace', 'TestContext', details),
      ).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should log a warning message', () => {
      expect(() => service.warn('Test warning')).not.toThrow();
    });

    it('should log a warning with context', () => {
      expect(() => service.warn('Test warning', 'TestContext')).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should log a debug message', () => {
      expect(() => service.debug('Test debug')).not.toThrow();
    });

    it('should log a debug message with context', () => {
      expect(() => service.debug('Test debug', 'TestContext')).not.toThrow();
    });
  });

  describe('verbose', () => {
    it('should log a verbose message', () => {
      expect(() => service.verbose('Test verbose')).not.toThrow();
    });

    it('should log a verbose message with context', () => {
      expect(() => service.verbose('Test verbose', 'TestContext')).not.toThrow();
    });
  });
});
