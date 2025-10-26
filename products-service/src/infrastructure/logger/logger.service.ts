import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILoggerService, ErrorDetails } from '../../domain/services/logger.service.interface';
import { promises as fs } from 'fs';
import { join } from 'path';
import { AppConfiguration } from '../config/configuration';
import { getConfig } from '../config';

interface ErrorLogEntry {
  requestId?: string;
  timestamp: string;
  level: 'error';
  errorCode?: string;
  message: string;
  stack?: string;
  context?: string;
  request?: {
    method: string;
    url: string;
    headers: Record<string, unknown>;
    body?: unknown;
    query?: unknown;
    params?: unknown;
    ip?: string;
    userAgent?: string;
  };
  response?: {
    statusCode: number;
  };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LoggerService implements ILoggerService {
  private readonly logger: Logger;
  private readonly logsDir: string;
  private readonly errorLogsFile: string;
  private readonly maxErrorLogs: number;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger('ProductsService');
    const config: AppConfiguration = getConfig(this.configService);
    this.logsDir = join(process.cwd(), config.logs.dir);
    this.errorLogsFile = join(this.logsDir, 'errors.json');
    this.maxErrorLogs = config.logs.maxErrorLogs;
  }

  private async initFileLogging() {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(this.logsDir, { recursive: true });

      try {
        await fs.access(this.errorLogsFile);
      } catch {
        await fs.writeFile(this.errorLogsFile, '[]', 'utf8');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize file logger:', error);
    }
  }

  private async writeErrorToFile(entry: ErrorLogEntry): Promise<void> {
    await this.initFileLogging();

    try {
      const fileContent: string = await fs.readFile(this.errorLogsFile, 'utf8');
      let logs: ErrorLogEntry[] = [];

      try {
        logs = JSON.parse(fileContent) as ErrorLogEntry[];
        if (!Array.isArray(logs)) logs = [];
      } catch {
        logs = [];
      }

      logs.push(entry);

      if (logs.length > this.maxErrorLogs) {
        logs = logs.slice(-this.maxErrorLogs);
      }

      await fs.writeFile(this.errorLogsFile, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to write error log:', error);
    }
  }

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string, details?: ErrorDetails): void {
    const contextToUse: string = details?.requestId
      ? `[${details.requestId}] ${context || 'Application'}`
      : context || 'Application';

    this.logger.error(message, trace, contextToUse);

    const errorEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack: trace,
      context: contextToUse,
      ...details,
    };

    this.writeErrorToFile(errorEntry).catch((err) => {
      console.error('Failed to log error to file:', err);
    });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}
