import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  LOGGER_SERVICE,
  ILoggerService,
  ErrorDetails,
} from '../../domain/services/logger.service.interface';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { BusinessException } from '../../domain/shared/exceptions';
import { ErrorCodeMetadata, ErrorCode } from '../../domain/shared/constants/error-codes';

interface RequestWithId extends Request {
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(LOGGER_SERVICE)
    private readonly loggerService: ILoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: RequestWithId = ctx.getRequest<RequestWithId>();
    const requestId: string = request.requestId || 'unknown';

    if (exception instanceof BusinessException) {
      this.loggerService.warn(
        `Business exception: ${exception.code} - ${exception.message}`,
        `[${requestId}]`,
      );

      const metadata: { description: string; httpStatus: number } | undefined =
        ErrorCodeMetadata[exception.code];

      response.status(exception.statusCode).json({
        status: exception.statusCode,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details || metadata?.description,
        },
        timestamp: new Date().toISOString(),
        requestId,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status: number = exception.getStatus();
      const exceptionResponse: string | Record<string, unknown> = exception.getResponse() as
        | string
        | Record<string, unknown>;

      this.loggerService.warn(`HTTP exception: ${status} - ${exception.message}`, `[${requestId}]`);

      const responseObj: Record<string, unknown> = exceptionResponse as Record<string, unknown>;
      const errorMessage: string =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : typeof responseObj?.message === 'string'
            ? responseObj.message
            : exception.message;
      const validationErrors: string[] | undefined =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        Array.isArray(responseObj?.message)
          ? (responseObj.message as string[])
          : undefined;

      if (validationErrors) {
        const details: Array<{ field: string; error: string }> = validationErrors.map(
          (msg: string) => {
            const match: RegExpMatchArray | null = msg.match(/^(\w+)\s+(.+)$/);
            return match ? { field: match[1], error: match[2] } : { field: 'unknown', error: msg };
          },
        );

        response.status(status).json({
          status,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Bad Request',
            details,
          },
          timestamp: new Date().toISOString(),
          requestId,
        });
      } else {
        response.status(status).json({
          status,
          error: {
            message: errorMessage,
          },
          timestamp: new Date().toISOString(),
          requestId,
        });
      }
      return;
    }

    const status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    const message: string =
      exception instanceof Error ? exception.message : 'Internal server error';
    const timestamp: string = new Date().toISOString();
    const stack: string | undefined = exception instanceof Error ? exception.stack : undefined;

    const errorDetails: ErrorDetails = {
      requestId,
      errorCode: String(ErrorCode.UNHANDLED_ERROR),
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: request.body as unknown,
        query: request.query,
        params: request.params,
        ip: request.ip,
        userAgent: request.get('user-agent'),
      },
      response: {
        statusCode: status,
      },
    };

    this.loggerService.error(message, stack, 'GlobalExceptionFilter', errorDetails);

    response.status(status).json({
      status,
      error: {
        code: ErrorCode.UNHANDLED_ERROR,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? message : 'An unhandled error occurred',
      },
      timestamp,
      requestId,
    });
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = { ...headers };
    const sensitiveHeaders: string[] = ['authorization', 'cookie', 'x-api-key'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
