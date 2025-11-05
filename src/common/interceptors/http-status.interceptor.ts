import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * HTTP 状态码拦截器
 * 将 POST 请求的默认状态码从 201 改为 200
 */
@Injectable()
export class HttpStatusInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      tap(() => {
        // 如果是 POST 请求且状态码是 201，改为 200
        if (
          request.method === 'POST' &&
          response.statusCode === (HttpStatus.CREATED as number)
        ) {
          response.status(HttpStatus.OK);
        }
      }),
    );
  }
}
