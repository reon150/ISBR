import { Test, TestingModule } from '@nestjs/testing';
import { ContextualLoggerService } from '@infrastructure/logger/contextual-logger.service';
import { ILoggerService, LOGGER_SERVICE } from '@domain/services/logger.service.interface';
import { mockLoggerService } from '../../../mocks';

describe('ContextualLoggerService', () => {
  let service: ContextualLoggerService;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockLogger = mockLoggerService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ContextualLoggerService,
          useFactory: (logger: ILoggerService) =>
            new ContextualLoggerService(logger, 'TestContext'),
          inject: [LOGGER_SERVICE],
        },
        {
          provide: LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ContextualLoggerService>(ContextualLoggerService);
    logger = module.get(LOGGER_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log with default context', () => {
      service.log('Test message');

      expect(logger.log).toHaveBeenCalledWith('Test message', 'TestContext');
    });

    it('should log with custom context', () => {
      service.log('Test message', 'CustomContext');

      expect(logger.log).toHaveBeenCalledWith('Test message', 'CustomContext');
    });
  });

  describe('error', () => {
    it('should error with default context', () => {
      service.error('Test error', 'Error trace');

      expect(logger.error).toHaveBeenCalledWith(
        'Test error',
        'Error trace',
        'TestContext',
        undefined,
      );
    });

    it('should error with custom context', () => {
      const details = { requestId: 'req-123' };
      service.error('Test error', 'Error trace', 'CustomContext', details);

      expect(logger.error).toHaveBeenCalledWith(
        'Test error',
        'Error trace',
        'CustomContext',
        details,
      );
    });
  });

  describe('warn', () => {
    it('should warn with default context', () => {
      service.warn('Test warning');

      expect(logger.warn).toHaveBeenCalledWith('Test warning', 'TestContext');
    });

    it('should warn with custom context', () => {
      service.warn('Test warning', 'CustomContext');

      expect(logger.warn).toHaveBeenCalledWith('Test warning', 'CustomContext');
    });
  });

  describe('debug', () => {
    it('should debug with default context', () => {
      service.debug('Test debug');

      expect(logger.debug).toHaveBeenCalledWith('Test debug', 'TestContext');
    });

    it('should debug with custom context', () => {
      service.debug('Test debug', 'CustomContext');

      expect(logger.debug).toHaveBeenCalledWith('Test debug', 'CustomContext');
    });
  });

  describe('verbose', () => {
    it('should verbose with default context', () => {
      service.verbose('Test verbose');

      expect(logger.verbose).toHaveBeenCalledWith('Test verbose', 'TestContext');
    });

    it('should verbose with custom context', () => {
      service.verbose('Test verbose', 'CustomContext');

      expect(logger.verbose).toHaveBeenCalledWith('Test verbose', 'CustomContext');
    });
  });
});
