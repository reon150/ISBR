import { ILoggerService, ErrorDetails } from '../../domain/services/logger.service.interface';

export class ContextualLoggerService implements ILoggerService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly context: string,
  ) {}

  log(message: string, context?: string): void {
    this.logger.log(message, context || this.context);
  }

  error(message: string, trace?: string, context?: string, details?: ErrorDetails): void {
    this.logger.error(message, trace, context || this.context, details);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context || this.context);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context || this.context);
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context || this.context);
  }
}
