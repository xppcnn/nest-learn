/**
 * 猫实体 - 可以继续使用 ClassSerializerInterceptor
 * 注意：如果需要排除字段，可以在服务层或使用自定义序列化逻辑
 */
export class Cat {
  id: number;
  name: string;
  age: number;
  breed: string;
  description?: string;

  // 内部使用字段 - 可以在返回前手动删除，或使用 ClassSerializerInterceptor + @Exclude 装饰器
  internalNotes?: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Cat>) {
    Object.assign(this, partial);
  }
}
