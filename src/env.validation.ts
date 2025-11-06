import { z } from 'zod';

/**
 * 环境变量验证 Schema - 使用 Zod
 */
const environmentSchema = z.object({
  PORT: z.string().min(1, 'PORT is required'),
  DATABASE_USER: z.string().min(1, 'DATABASE_USER is required'),
  DATABASE_PASSWORD: z.string().min(1, 'DATABASE_PASSWORD is required'),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnv(config: Record<string, unknown>) {
  try {
    const validatedConfig = environmentSchema.parse(config);
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`,
      );
      throw new Error(
        `Environment validation failed:\n${formattedErrors.join('\n')}`,
      );
    }
    throw error;
  }
}
