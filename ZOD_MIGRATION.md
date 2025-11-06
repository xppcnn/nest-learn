# Zod 迁移说明

## 概述

本项目已成功从 `class-validator` 和 `class-transformer` 迁移到 `zod` 进行数据验证。

## 主要变更

### 1. 依赖变更

**移除的依赖：**
- `class-validator`
- `class-transformer`

**新增的依赖：**
- `zod` - 强大的 TypeScript-first 模式验证库
- `nestjs-zod` - NestJS 的 Zod 集成工具

### 2. DTO 迁移

#### CreateCatDto
**之前 (class-validator):**
```typescript
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
```

**现在 (zod):**
```typescript
import { z } from 'zod';

export const createCatSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce
    .number()
    .int()
    .min(0, 'Age must be at least 0')
    .max(30, 'Age must be at most 30'),
  breed: z.string().min(1, 'Breed is required'),
  description: z.string().optional(),
});

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

#### UpdateCatDto
**之前:**
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateCatDto } from './create-cat.dto';

export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

**现在:**
```typescript
import { z } from 'zod';
import { createCatSchema } from './create-cat.dto';

export const updateCatSchema = createCatSchema.partial();
export type UpdateCatDto = z.infer<typeof updateCatSchema>;
```

#### PaginationDto
**之前:**
```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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
```

**现在:**
```typescript
import { z } from 'zod';

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
```

### 3. 验证管道

创建了自定义的 `ZodValidationPipe` 来替代 NestJS 的 `ValidationPipe`：

```typescript
// src/common/pipes/zod-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
```

### 4. 控制器更新

在控制器中使用 `ZodValidationPipe`：

```typescript
import type { CreateCatDto } from './dto/create-cat.dto';
import { createCatSchema } from './dto/create-cat.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('cats')
export class CatsController {
  @Post()
  create(
    @Body(new ZodValidationPipe(createCatSchema)) createCatDto: CreateCatDto,
  ): Cat {
    return this.catsService.create(createCatDto);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(paginationSchema)) pagination: PaginationDto,
  ): Cat[] {
    return this.catsService.findAll();
  }
}
```

### 5. 环境变量验证

**之前：**
```typescript
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  PORT: string;
  // ...
}
```

**现在：**
```typescript
import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z.string().min(1, 'PORT is required'),
  DATABASE_USER: z.string().min(1, 'DATABASE_USER is required'),
  DATABASE_PASSWORD: z.string().min(1, 'DATABASE_PASSWORD is required'),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnv(config: Record<string, unknown>) {
  try {
    return environmentSchema.parse(config);
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
```

### 6. main.ts 变更

移除了全局的 `ValidationPipe`，因为现在使用基于路由的 `ZodValidationPipe`：

```typescript
// 之前
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

// 现在
// 注意：现在使用 Zod 验证，通过在各个路由处理器上使用 ZodValidationPipe
// 不再需要全局 ValidationPipe
```

## Zod 的优势

1. **TypeScript-first**: Zod 从头设计为 TypeScript 优先，类型推断更强大
2. **零依赖**: Zod 不需要额外的依赖
3. **更简洁的 API**: 使用链式 API，代码更简洁易读
4. **运行时类型安全**: 同时提供编译时和运行时类型检查
5. **更好的错误信息**: Zod 提供详细且可定制的错误消息
6. **类型推断**: 使用 `z.infer<>` 从 schema 自动推断 TypeScript 类型

## 注意事项

1. **类型导入**: 在装饰器中使用的类型需要使用 `import type` 语法
2. **coerce 方法**: 使用 `z.coerce.number()` 来自动转换字符串到数字（类似之前的 `@Type()` 装饰器）
3. **ClassSerializerInterceptor**: 如果需要序列化功能（如 `@Exclude`），仍然需要 `class-transformer`。目前已移除该依赖，如需要可以在服务层手动处理序列化逻辑
4. **验证错误格式**: Zod 的错误使用 `issues` 属性而不是 `errors` 属性

## 测试建议

迁移后建议测试以下功能：

1. ✅ POST 请求验证（创建猫）
2. ✅ PATCH 请求验证（更新猫）
3. ✅ Query 参数验证（分页）
4. ✅ 错误消息格式
5. ✅ 类型转换（字符串到数字）
6. ✅ 构建成功

## 相关链接

- [Zod 官方文档](https://zod.dev/)
- [NestJS-Zod](https://github.com/risen228/nestjs-zod)

