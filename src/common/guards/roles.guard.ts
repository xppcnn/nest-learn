import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '@/common/interfaces/auth-user.interface';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ForbiddenException } from '@nestjs/common';
import { ResponseCode } from '@/common/response.class';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;
    console.log("🚀 ~ RolesGuard ~ canActivate ~ user:", user)

    if (!user) {
      throw new ForbiddenException('未获取到用户信息，请检查 token 逻辑');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    console.log("🚀 ~ RolesGuard ~ canActivate ~ hasRole:", hasRole)

    if (!hasRole) {
      throw new BusinessException(ResponseCode.FORBIDDEN, '无权访问该资源');
    }

    return true;
  }
}
