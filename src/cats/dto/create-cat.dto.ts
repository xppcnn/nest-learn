import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建猫的 DTO - 演示 ValidationPipe 的使用
 */
export class CreateCatDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  age: number;

  @IsString()
  breed: string;

  @IsOptional()
  @IsString()
  description?: string;
}
