import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前用户装饰器
 * 用法: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return request.user;
  },
);
