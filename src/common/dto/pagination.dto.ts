import { z } from 'zod';

/**
 * 分页查询 DTO（基于页码）- 使用 Zod 进行验证
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1)
    .optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'PageSize must be at least 1')
    .max(100, 'PageSize must be at most 100')
    .default(10)
    .optional(),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

/**
 * 分页响应元数据
 */
export interface PageInfo {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
  data: T[];
  pageInfo: PageInfo;
}
