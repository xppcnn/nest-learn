import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 统一成功响应结构
 */
export enum ResponseCode {
  SUCCESS = 200,
  ERROR = 500,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
}
export interface Response<T> {
  data: T;
  code: ResponseCode;
  message: string;
}

/**
 * 响应转换拦截器
 * 将所有成功响应包装成统一格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data): Response<T> => {
        // 如果响应已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'data' in data) {
          return data as Response<T>;
        }

        // 否则包装成标准格式
        return {
          data: data as T,
          code: ResponseCode.SUCCESS,
          message: 'Success',
        };
      }),
    );
  }
}
