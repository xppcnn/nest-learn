import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 聊天请求 DTO
 */
export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  context?: string;
}

