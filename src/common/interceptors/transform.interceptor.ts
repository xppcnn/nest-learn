import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../response.class';

/**
 * 统一成功响应结构
 */

/**
 * 响应转换拦截器
 * 将所有成功响应包装成统一格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        // 如果响应已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'data' in data) {
          return data as ApiResponse<T>;
        }
        // 否则包装成标准格式
        return ApiResponse.success(data as T, 'success');
      }),
    );
  }
}
