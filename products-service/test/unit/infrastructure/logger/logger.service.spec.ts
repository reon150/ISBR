import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getConfig } from '@infrastructure/config';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

// Mock the getConfig function
jest.mock('@infrastructure/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    logs: {
      dir: './logs',
      maxErrorLogs: 1000,
    },
  }),
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue({
        logs: {
          dir: './logs',
          maxErrorLogs: 1000,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log message with context', () => {
      // Test that the method doesn't throw
      expect(() => service.log('Test message', 'TestContext')).not.toThrow();
    });

    it('should log message without context', () => {
      // Test that the method doesn't throw
      expect(() => service.log('Test message')).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should warn message with context', () => {
      // Test that the method doesn't throw
      expect(() => service.warn('Test warning', 'TestContext')).not.toThrow();
    });

    it('should warn message without context', () => {
      // Test that the method doesn't throw
      expect(() => service.warn('Test warning')).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should debug message with context', () => {
      // Test that the method doesn't throw
      expect(() => service.debug('Test debug', 'TestContext')).not.toThrow();
    });

    it('should debug message without context', () => {
      // Test that the method doesn't throw
      expect(() => service.debug('Test debug')).not.toThrow();
    });
  });

  describe('verbose', () => {
    it('should verbose message with context', () => {
      // Test that the method doesn't throw
      expect(() => service.verbose('Test verbose', 'TestContext')).not.toThrow();
    });

    it('should verbose message without context', () => {
      // Test that the method doesn't throw
      expect(() => service.verbose('Test verbose')).not.toThrow();
    });
  });

  describe('error', () => {
    it('should log error with context and trace', () => {
      // Test that the method doesn't throw
      expect(() => service.error('Test error', 'Error trace', 'TestContext')).not.toThrow();
    });

    it('should log error with details', () => {
      const details = {
        requestId: 'req-123',
        errorCode: 'TEST_ERROR',
        request: {
          method: 'GET',
          url: '/test',
          headers: {},
        },
        response: {
          statusCode: 500,
        },
        metadata: {
          userId: 'user-1',
        },
      };

      // Test that the method doesn't throw
      expect(() =>
        service.error('Test error', 'Error trace', 'TestContext', details),
      ).not.toThrow();
    });

    it('should log error without context', () => {
      // Test that the method doesn't throw
      expect(() => service.error('Test error', 'Error trace')).not.toThrow();
    });

    it('should handle file logging errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock fs operations to throw errors
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('File system error'));

      service.error('Test error', 'Error trace', 'TestContext');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('file logging', () => {
    it('should initialize file logging on first error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock successful file operations
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockRejectedValue(new Error('File does not exist'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue('[]');

      service.error('Test error', 'Error trace', 'TestContext');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should append to existing error log file', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const existingLogs = JSON.stringify([
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          level: 'error',
          message: 'Previous error',
        },
      ]);

      // Mock successful file operations
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(existingLogs);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      service.error('New error', 'Error trace', 'TestContext');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fs.readFile).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle corrupted log file gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock corrupted file content
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue('corrupted json');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      service.error('Test error', 'Error trace', 'TestContext');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fs.writeFile).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
