import { z } from 'zod';
import { createCatSchema } from './create-cat.dto';

/**
 * 更新猫的 DTO - 使 CreateCatDto 的所有字段可选
 */
export const updateCatSchema = createCatSchema.partial();

export type UpdateCatDto = z.infer<typeof updateCatSchema>;
