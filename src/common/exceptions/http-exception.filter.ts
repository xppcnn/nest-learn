import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'nestjs-pino';
import { BusinessException } from './business.exception';

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
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // 生成追踪 ID
    const traceId = (request.headers['x-trace-id'] as string) || uuidv4();

    let status: number;
    let responseBody: any;

    // 处理业务异常 - HTTP 200 但业务 code 不为 200
    if (exception instanceof BusinessException) {
      status = HttpStatus.OK; // HTTP 状态码为 200
      const exceptionResponse = exception.getResponse() as {
        code: number;
        message: string;
        data: any;
      };

      responseBody = {
        data: exceptionResponse.data,
        code: exceptionResponse.code,
        message: exceptionResponse.message,
      };

      // 记录业务异常日志
      this.logger.warn(
        `[Business Exception] [${request.method}] ${request.url} - Code: ${exceptionResponse.code} - Message: ${exceptionResponse.message} - TraceId: ${traceId}`,
      );
    } else if (exception instanceof HttpException) {
      // 处理 NestJS 的 HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as {
          error?: string;
          message?: string | string[];
          details?: unknown;
        };
        responseBody = {
          code: resp.error || HttpStatus[status],
          message: Array.isArray(resp.message)
            ? resp.message.join(', ')
            : resp.message || exception.message,
          details: resp.details,
          traceId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        responseBody = {
          code: HttpStatus[status],
          message: String(exceptionResponse),
          traceId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }

      // 记录 HTTP 异常日志
      this.logger.error(
        `[HTTP Exception] [${request.method}] ${request.url} - Status: ${status} - TraceId: ${traceId}`,
        exception.stack,
      );
    } else {
      // 处理未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';

      responseBody = {
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
        `[Unknown Exception] ${errorMessage}`,
        exception instanceof Error ? exception.stack : '',
        `TraceId: ${traceId}`,
      );
    }

    response.status(status).json(responseBody);
  }
}
