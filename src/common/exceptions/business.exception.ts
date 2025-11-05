import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from '../response.class';

/**
 * 业务异常类
 * 用于抛出业务逻辑错误，HTTP 状态码为 200，但响应体中的 code 表示业务错误
 *
 * @example
 * ```typescript
 * // 使用预定义的 ResponseCode
 * throw new BusinessException(ResponseCode.BAD_REQUEST, '用户名已存在');
 *
 * // 使用自定义业务错误码
 * throw new BusinessException(1001, '库存不足');
 *
 * // 带额外数据
 * throw new BusinessException(1002, '订单已过期', { orderId: '123' });
 * ```
 */
export class BusinessException extends HttpException {
  constructor(
    private readonly businessCode: ResponseCode | number,
    message: string,
    private readonly data: any = null,
  ) {
    // HTTP 状态码始终为 200
    super(
      {
        code: businessCode,
        message,
        data,
      },
      HttpStatus.OK,
    );
  }

  getBusinessCode(): ResponseCode | number {
    return this.businessCode;
  }

  getData(): any {
    return this.data;
  }
}

/**
 * 常用业务异常的快捷方法
 */
export class BusinessExceptions {
  /**
   * 参数错误
   */
  static badRequest(message: string, data?: any): BusinessException {
    return new BusinessException(ResponseCode.BAD_REQUEST, message, data);
  }

  /**
   * 未授权
   */
  static unauthorized(
    message: string = '未授权',
    data?: any,
  ): BusinessException {
    return new BusinessException(ResponseCode.UNAUTHORIZED, message, data);
  }

  /**
   * 禁止访问
   */
  static forbidden(
    message: string = '无权限访问',
    data?: any,
  ): BusinessException {
    return new BusinessException(ResponseCode.FORBIDDEN, message, data);
  }

  /**
   * 资源未找到
   */
  static notFound(
    message: string = '资源不存在',
    data?: any,
  ): BusinessException {
    return new BusinessException(ResponseCode.NOT_FOUND, message, data);
  }

  /**
   * 通用业务错误
   */
  static error(message: string = '服务器错误', data?: any): BusinessException {
    return new BusinessException(ResponseCode.BUSINESS_ERROR, message, data);
  }

  /**
   * 自定义业务错误码
   */
  static custom(code: number, message: string, data?: any): BusinessException {
    return new BusinessException(code, message, data);
  }
}
