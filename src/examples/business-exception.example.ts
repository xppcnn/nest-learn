/**
 * BusinessException 使用示例
 *
 * BusinessException 用于处理业务逻辑错误，与普通的 HttpException 不同：
 * - HTTP 状态码始终为 200
 * - 响应体中的 code 字段表示业务错误码
 * - 可以自定义 code 和 message
 */

import { BusinessException, BusinessExceptions } from '../common';
import { ResponseCode } from '../common/response.class';

/**
 * 示例 1: 使用预定义的 ResponseCode
 */
export function example1() {
  // 抛出业务异常，HTTP 200，但 code 为 400
  throw new BusinessException(ResponseCode.BAD_REQUEST, '用户名已存在');

  /**
   * 响应示例：
   * HTTP Status: 200 OK
   * {
   *   "data": null,
   *   "code": 400,
   *   "message": "用户名已存在"
   * }
   */
}

/**
 * 示例 2: 使用自定义业务错误码
 */
export function example2() {
  // 使用自定义错误码（如 1001, 1002 等）
  throw new BusinessException(1001, '库存不足，无法下单');

  /**
   * 响应示例：
   * HTTP Status: 200 OK
   * {
   *   "data": null,
   *   "code": 1001,
   *   "message": "库存不足，无法下单"
   * }
   */
}

/**
 * 示例 3: 带额外数据的业务异常
 */
export function example3() {
  throw new BusinessException(1002, '订单已过期', {
    orderId: '12345',
    expiredAt: '2025-11-01',
    canRenew: true,
  });

  /**
   * 响应示例：
   * HTTP Status: 200 OK
   * {
   *   "data": {
   *     "orderId": "12345",
   *     "expiredAt": "2025-11-01",
   *     "canRenew": true
   *   },
   *   "code": 1002,
   *   "message": "订单已过期"
   * }
   */
}

/**
 * 示例 4: 使用 BusinessExceptions 快捷方法
 */
export class UserService {
  findUser(id: number) {
    const user = null; // 模拟查询

    if (!user) {
      // 使用快捷方法
      throw BusinessExceptions.notFound('用户不存在');
    }

    return user;
  }

  validatePassword(password: string) {
    if (password.length < 6) {
      // 参数错误
      throw BusinessExceptions.badRequest('密码长度不能少于6位');
    }
  }

  checkPermission(userRole: string) {
    if (userRole !== 'admin') {
      // 禁止访问
      throw BusinessExceptions.forbidden('只有管理员可以访问此资源');
    }
  }

  validateToken(token: string) {
    if (!token) {
      // 未授权
      throw BusinessExceptions.unauthorized('请先登录');
    }
  }
}

/**
 * 示例 5: 在实际业务中使用
 */
export class OrderService {
  createOrder(userId: number, productId: number, quantity: number) {
    // 检查用户
    const user = this.getUserById(userId);
    if (!user) {
      throw BusinessExceptions.notFound('用户不存在', { userId });
    }

    // 检查产品
    const product = this.getProductById(productId);
    if (!product) {
      throw BusinessExceptions.notFound('商品不存在', { productId });
    }

    // 检查库存
    if (product.stock < quantity) {
      throw new BusinessException(2001, '库存不足', {
        productId,
        requestedQuantity: quantity,
        availableStock: product.stock,
      });
    }

    // 检查价格
    if (product.price <= 0) {
      throw new BusinessException(2002, '商品价格异常', {
        productId,
        price: product.price,
      });
    }

    // 创建订单...
    return { success: true };
  }

  private getUserById(id: number) {
    return { id, name: 'User' };
  }

  private getProductById(id: number) {
    return { id, name: 'Product', stock: 10, price: 100 };
  }
}

/**
 * 示例 6: 对比 HttpException 和 BusinessException
 */
export function comparisonExample() {
  // HttpException - HTTP 状态码非 200
  // throw new NotFoundException('资源未找到');
  /**
   * HTTP Status: 404 Not Found
   * {
   *   "code": "NOT_FOUND",
   *   "message": "资源未找到",
   *   "traceId": "uuid",
   *   "timestamp": "2025-11-05T12:00:00.000Z",
   *   "path": "/api/users/999"
   * }
   */

  // BusinessException - HTTP 状态码 200，业务 code 表示错误
  throw BusinessExceptions.notFound('资源未找到');
  /**
   * HTTP Status: 200 OK
   * {
   *   "data": null,
   *   "code": 404,
   *   "message": "资源未找到"
   * }
   */
}

/**
 * 最佳实践建议：
 *
 * 1. 使用场景：
 *    - HttpException: 用于真正的 HTTP 协议错误（404, 500等）
 *    - BusinessException: 用于业务逻辑验证失败（用户名重复、库存不足等）
 *
 * 2. 错误码规范：
 *    - 1xxx: 用户相关错误
 *    - 2xxx: 订单相关错误
 *    - 3xxx: 商品相关错误
 *    - 4xxx: 支付相关错误
 *    - ...根据业务模块定义
 *
 * 3. 返回数据：
 *    - 提供足够的上下文信息帮助前端处理
 *    - 避免返回敏感信息
 *    - 保持数据结构一致
 *
 * 4. 日志记录：
 *    - BusinessException 会以 WARN 级别记录
 *    - 便于监控和排查问题
 */
