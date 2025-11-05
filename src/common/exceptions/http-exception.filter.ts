import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * 统一异常响应结构
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  traceId: string;
  timestamp: string;
  path: string;
}

/**
 * 全局 HTTP 异常过滤器
 * 捕获所有异常并返回统一的错误响应格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // 生成追踪 ID
    const traceId = (request.headers['x-trace-id'] as string) || uuidv4();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      // 处理 NestJS 的 HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as {
          error?: string;
          message?: string | string[];
          details?: unknown;
        };
        errorResponse = {
          code: response.error || HttpStatus[status],
          message: Array.isArray(response.message)
            ? response.message.join(', ')
            : response.message || exception.message,
          details: response.details,
          traceId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        errorResponse = {
          code: HttpStatus[status],
          message: String(exceptionResponse),
          traceId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    } else {
      // 处理未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';

      errorResponse = {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        traceId,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      // 记录未知异常的详细信息
      this.logger.error(
        `Unhandled exception: ${errorMessage}`,
        exception instanceof Error ? exception.stack : '',
        `TraceId: ${traceId}`,
      );
    }

    // 记录错误日志
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - TraceId: ${traceId}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}
