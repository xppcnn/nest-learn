import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 总结请求 DTO
 */
export class SummarizeDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

