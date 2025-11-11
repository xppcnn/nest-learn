import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 分页查询 DTO（基于页码）- 使用 class-validator 进行验证
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}

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
