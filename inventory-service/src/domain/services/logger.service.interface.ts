export const LOGGER_SERVICE: symbol = Symbol('LOGGER_SERVICE');

export interface ErrorDetails {
  requestId?: string;
  errorCode?: string;
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

export interface ILoggerService {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string, details?: ErrorDetails): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
}
