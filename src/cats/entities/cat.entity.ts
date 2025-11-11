import { Exclude } from 'class-transformer';

/**
 * 猫实体 - 使用 class-transformer 的 @Exclude 装饰器排除敏感字段
 */
export class Cat {
  id: number;
  name: string;
  age: number;
  breed: string;
  description?: string | null;

  @Exclude()
  internalNotes?: string | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Cat>) {
    Object.assign(this, partial);
  }
}
