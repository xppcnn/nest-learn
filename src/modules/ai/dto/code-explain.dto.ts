import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 代码解释请求 DTO
 */
export class CodeExplainDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  language?: string = 'TypeScript';
}

