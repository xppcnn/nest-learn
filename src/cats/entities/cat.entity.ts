import { Exclude } from 'class-transformer';

/**
 * 猫实体 - 演示 ClassSerializerInterceptor 的使用
 */
export class Cat {
  id: number;
  name: string;
  age: number;
  breed: string;
  description?: string;

  @Exclude() // 这个字段不会出现在 API 响应中
  internalNotes?: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Cat>) {
    Object.assign(this, partial);
  }
}
