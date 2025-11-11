import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 翻译请求 DTO
 */
export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  targetLanguage?: string = 'Chinese';
}

