import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

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

  @IsString()
  DATABASE_USER?: string;

  @IsString()
  DATABASE_PASSWORD?: string;
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
