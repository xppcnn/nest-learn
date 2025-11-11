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
 * 响应转换拦截器
 * 功能：将所有成功响应包装成统一格式
 * 注意：字段过滤由 ClassSerializerInterceptor 和 @Exclude 装饰器处理
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
        // 包装成统一响应格式
        if (data && typeof data === 'object' && 'data' in data) {
          return data as ApiResponse<T>;
        }

        return ApiResponse.success(data as T, 'success');
      }),
    );
  }
}
