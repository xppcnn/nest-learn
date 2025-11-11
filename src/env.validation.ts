import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

/**
 * 环境变量验证 - 使用 class-validator
 */
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_USER: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  REDIS_URL: string;

  @IsNotEmpty()
  @IsString()
  OPENROUTER_API_KEY: string;

  @IsNotEmpty()
  @IsString()
  AI_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  OPENROUTER_MODEL: string;

  @IsOptional()
  @IsString()
  OPENROUTER_REFERER: string;

  @IsString()
  @IsOptional()
  OPENROUTER_APP_NAME: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors.map(
      (error) =>
        `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
    );
    throw new Error(
      `Environment validation failed:\n${formattedErrors.join('\n')}`,
    );
  }

  return validatedConfig;
}
