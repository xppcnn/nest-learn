import { z } from 'zod';

/**
 * 创建猫的 DTO - 使用 Zod 进行验证
 */
export const createCatSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce
    .number()
    .int()
    .min(0, 'Age must be at least 0')
    .max(30, 'Age must be at most 30'),
  breed: z.string().min(1, 'Breed is required'),
  description: z.string().optional(),
});

export type CreateCatDto = z.infer<typeof createCatSchema>;
