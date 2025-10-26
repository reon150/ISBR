import { Test, TestingModule } from '@nestjs/testing';
import { ContextualLoggerService } from '@infrastructure/logger/contextual-logger.service';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';

describe('ContextualLoggerService', () => {
  let service: ContextualLoggerService;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LOGGER_SERVICE,
          useValue: mockLogger,
        },
        {
          provide: ContextualLoggerService,
          useFactory: (logger: ILoggerService) =>
            new ContextualLoggerService(logger, 'TestContext'),
          inject: [LOGGER_SERVICE],
        },
      ],
    }).compile();

    service = module.get<ContextualLoggerService>(ContextualLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log message with default context', () => {
      service.log('Test message');

      expect(mockLogger.log).toHaveBeenCalledWith('Test message', 'TestContext');
    });

    it('should log message with custom context', () => {
      service.log('Test message', 'CustomContext');

      expect(mockLogger.log).toHaveBeenCalledWith('Test message', 'CustomContext');
    });
  });

  describe('error', () => {
    it('should log error with default context', () => {
      const details = { code: 'ERR_001' };
      service.error('Error message', 'Error trace', undefined, details);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error message',
        'Error trace',
        'TestContext',
        details,
      );
    });

    it('should log error with custom context', () => {
      const details = { code: 'ERR_002' };
      service.error('Error message', 'Error trace', 'CustomContext', details);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error message',
        'Error trace',
        'CustomContext',
        details,
      );
    });

    it('should log error without details', () => {
      service.error('Error message', 'Error trace');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error message',
        'Error trace',
        'TestContext',
        undefined,
      );
    });
  });

  describe('warn', () => {
    it('should log warning with default context', () => {
      service.warn('Warning message');

      expect(mockLogger.warn).toHaveBeenCalledWith('Warning message', 'TestContext');
    });

    it('should log warning with custom context', () => {
      service.warn('Warning message', 'CustomContext');

      expect(mockLogger.warn).toHaveBeenCalledWith('Warning message', 'CustomContext');
    });
  });

  describe('debug', () => {
    it('should log debug message with default context', () => {
      service.debug('Debug message');

      expect(mockLogger.debug).toHaveBeenCalledWith('Debug message', 'TestContext');
    });

    it('should log debug message with custom context', () => {
      service.debug('Debug message', 'CustomContext');

      expect(mockLogger.debug).toHaveBeenCalledWith('Debug message', 'CustomContext');
    });
  });

  describe('verbose', () => {
    it('should log verbose message with default context', () => {
      service.verbose('Verbose message');

      expect(mockLogger.verbose).toHaveBeenCalledWith('Verbose message', 'TestContext');
    });

    it('should log verbose message with custom context', () => {
      service.verbose('Verbose message', 'CustomContext');

      expect(mockLogger.verbose).toHaveBeenCalledWith('Verbose message', 'CustomContext');
    });
  });
});
