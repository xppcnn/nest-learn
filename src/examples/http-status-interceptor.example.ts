/**
 * HttpStatusInterceptor 使用示例
 *
 * 这个拦截器将 POST 请求的默认状态码从 201 改为 200
 */

/**
 * 为什么需要这个拦截器？
 *
 * NestJS 默认行为：
 * - GET, PUT, PATCH, DELETE 等请求返回 200
 * - POST 请求返回 201 (Created)
 *
 * 业务场景：
 * 在某些前端框架或 API 设计规范中，统一使用 200 状态码表示成功，
 * 而通过响应体中的 code 字段来区分不同的业务状态。
 */

/**
 * 示例：创建猫的接口
 */
import { Controller, Post, Body } from '@nestjs/common';

class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}

@Controller('cats')
export class CatsController {
  /**
   * 没有使用 HttpStatusInterceptor 时：
   * POST /cats
   * HTTP Status: 201 Created
   * {
   *   "data": { "id": 1, "name": "Fluffy", "age": 2, "breed": "Persian" },
   *   "code": 200,
   *   "message": "Success"
   * }
   */

  /**
   * 使用 HttpStatusInterceptor 后：
   * POST /cats
   * HTTP Status: 200 OK  ← 状态码从 201 改为 200
   * {
   *   "data": { "id": 1, "name": "Fluffy", "age": 2, "breed": "Persian" },
   *   "code": 200,
   *   "message": "Success"
   * }
   */
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return {
      id: 1,
      ...createCatDto,
    };
  }
}

/**
 * 拦截器的工作原理：
 *
 * 1. 拦截所有 HTTP 请求
 * 2. 检查请求方法是否为 POST
 * 3. 检查响应状态码是否为 201
 * 4. 如果满足条件，将状态码改为 200
 */

/**
 * 配置位置：
 * src/main.ts
 *
 * ```typescript
 * // 全局 HTTP 状态码拦截器（将 POST 的 201 改为 200）
 * app.useGlobalInterceptors(new HttpStatusInterceptor());
 * ```
 */

/**
 * 拦截器执行顺序：
 *
 * 1. ValidationPipe - 验证请求参数
 * 2. Controller Handler - 执行业务逻辑
 * 3. ClassSerializerInterceptor - 序列化响应数据
 * 4. HttpStatusInterceptor - 修改状态码（将 POST 201 → 200）
 * 5. TransformInterceptor - 包装成统一响应格式
 * 6. HttpExceptionFilter - 捕获异常（如果有）
 */

/**
 * 注意事项：
 *
 * 1. 只影响 POST 请求，其他请求方法不受影响
 * 2. 只修改默认的 201 状态码，手动设置的状态码不会被修改
 * 3. 在 TransformInterceptor 之前执行，确保状态码先被修改
 */

/**
 * 如果想要自定义特定接口的状态码：
 */
@Controller('custom')
export class CustomController {
  @Post()
  // 可以使用 @HttpCode() 装饰器显式指定状态码
  // @HttpCode(201)  // 如果需要保留 201
  createCustom() {
    return { success: true };
  }
}

