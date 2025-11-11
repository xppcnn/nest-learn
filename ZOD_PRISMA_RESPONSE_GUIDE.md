# 使用 zod-prisma-types 限制接口返回值

本指南介绍如何使用 `zod-prisma-types` 从 Prisma schema 自动生成 Zod schemas，并用它们来限制 API 接口的返回值。

## 📋 目录

1. [为什么需要限制返回值](#为什么需要限制返回值)
2. [安装和配置](#安装和配置)
3. [生成 Zod Schemas](#生成-zod-schemas)
4. [创建响应 DTO](#创建响应-dto)
5. [在服务中使用](#在服务中使用)
6. [在控制器中使用](#在控制器中使用)
7. [测试验证](#测试验证)
8. [高级用法](#高级用法)

---

## 🎯 为什么需要限制返回值

### 问题场景

在实际项目中，数据库模型通常包含不应该暴露给客户端的敏感字段：

```typescript
model Cat {
  id            Int      @id @default(autoincrement())
  name          String
  age           Int
  breed         String
  description   String?
  internalNotes String?  // ⚠️ 敏感字段：内部备注，不应返回给客户端
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 解决方案

使用 `zod-prisma-types` 自动生成 Zod schemas，然后创建响应 DTO 来：
- ✅ 自动排除敏感字段
- ✅ 类型安全
- ✅ 运行时验证
- ✅ 减少手动维护

---

## 🚀 安装和配置

### 1. 安装依赖

```bash
pnpm add -D zod-prisma-types
```

### 2. 配置 Prisma Schema

编辑 `prisma/schema.prisma`，添加 zod 生成器：

```prisma
generator client {
  provider = "prisma-client-js"
}

generator zod {
  provider                 = "npx zod-prisma-types"
  output                   = "../src/generated/zod"
  createInputTypes         = false     // 不生成输入类型
  createModelTypes         = true      // 生成模型类型
  addInputTypeValidation   = false
  addIncludeType           = false
  addSelectType            = false
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Cat {
  id            Int      @id @default(autoincrement())
  name          String
  age           Int
  breed         String
  description   String?
  internalNotes String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("cats")
}
```

---

## 🔨 生成 Zod Schemas

运行 Prisma generate 命令：

```bash
pnpm dlx prisma generate
```

这会在 `src/generated/zod/index.ts` 生成以下内容：

```typescript
import { z } from 'zod';

export const CatSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  age: z.number().int(),
  breed: z.string(),
  description: z.string().nullable(),
  internalNotes: z.string().nullable(),  // 包含所有字段
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Cat = z.infer<typeof CatSchema>
```

---

## 📝 创建响应 DTO

创建 `src/cats/dto/cat-response.dto.ts`：

```typescript
import { z } from 'zod';
import { CatSchema } from '../../generated/zod';

/**
 * Cat 响应 DTO - 排除敏感字段
 */
export const catResponseSchema = CatSchema.omit({
  internalNotes: true,  // 排除敏感字段
});

export type CatResponseDto = z.infer<typeof catResponseSchema>;

/**
 * Cat 列表响应 Schema（带分页信息）
 */
export const catListResponseSchema = z.object({
  data: z.array(catResponseSchema),
  pageInfo: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    totalPages: z.number().optional(),
    hasNextPage: z.boolean().optional(),
    hasPrevPage: z.boolean().optional(),
  }).optional(),
});

export type CatListResponseDto = z.infer<typeof catListResponseSchema>;

/**
 * Cat 简化响应 - 只返回基本信息
 */
export const catSummaryResponseSchema = CatSchema.pick({
  id: true,
  name: true,
  age: true,
  breed: true,
});

export type CatSummaryResponseDto = z.infer<typeof catSummaryResponseSchema>;

/**
 * Cat 详情响应 - 可以添加额外的计算字段
 */
export const catDetailResponseSchema = catResponseSchema.extend({
  ageCategory: z.enum(['kitten', 'adult', 'senior']).optional(),
});

export type CatDetailResponseDto = z.infer<typeof catDetailResponseSchema>;
```

---

## 💼 在服务中使用

更新 `src/cats/cats.service.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { catResponseSchema, type CatResponseDto } from './dto/cat-response.dto';

@Injectable()
export class CatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有猫（使用 Zod 验证返回值，排除敏感字段）
   */
  async findAll(): Promise<CatResponseDto[]> {
    const cats = await this.prisma.cat.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // 使用 Zod schema 验证和转换数据，自动排除 internalNotes
    return cats.map((cat) => catResponseSchema.parse(cat));
  }

  /**
   * 根据 ID 获取猫
   */
  async findOne(id: number): Promise<CatResponseDto> {
    const cat = await this.prisma.cat.findUnique({
      where: { id },
    });
    
    if (!cat) {
      throw new NotFoundException(`Cat with ID ${id} not found`);
    }
    
    // 使用 Zod schema 验证和转换数据，自动排除 internalNotes
    return catResponseSchema.parse(cat);
  }

  /**
   * 创建新猫
   */
  async create(createCatDto: CreateCatDto): Promise<CatResponseDto> {
    const cat = await this.prisma.cat.create({
      data: {
        ...createCatDto,
        internalNotes: 'This is internal data - should not be exposed',
      },
    });

    // 使用 Zod schema 验证和转换数据，自动排除 internalNotes
    return catResponseSchema.parse(cat);
  }

  /**
   * 更新猫信息
   */
  async update(id: number, updateCatDto: UpdateCatDto): Promise<CatResponseDto> {
    const updatedCat = await this.prisma.cat.update({
      where: { id },
      data: updateCatDto,
    });

    // 使用 Zod schema 验证和转换数据，自动排除 internalNotes
    return catResponseSchema.parse(updatedCat);
  }
}
```

### 关键点

1. **返回类型**：将返回类型从 `Cat` 改为 `CatResponseDto`
2. **数据转换**：使用 `catResponseSchema.parse(cat)` 来验证和转换数据
3. **自动排除**：`internalNotes` 字段会自动被排除

---

## 🎮 在控制器中使用

更新 `src/cats/cats.controller.ts`：

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CatsService } from './cats.service';
import type { CatResponseDto } from './dto/cat-response.dto';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  /**
   * 获取所有猫
   * 返回：CatResponseDto[]（不包含 internalNotes）
   */
  @Get()
  async findAll(): Promise<CatResponseDto[]> {
    return this.catsService.findAll();
  }

  /**
   * 根据 ID 获取猫
   * 返回：CatResponseDto（不包含 internalNotes）
   */
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<CatResponseDto> {
    return this.catsService.findOne(id);
  }

  /**
   * 创建新猫
   * 返回：CatResponseDto（不包含 internalNotes）
   */
  @Post()
  async create(@Body() createCatDto: CreateCatDto): Promise<CatResponseDto> {
    return this.catsService.create(createCatDto);
  }
}
```

---

## 🧪 测试验证

### 启动应用

```bash
pnpm run start:dev
```

### 测试 GET /cats

```bash
curl http://localhost:8866/cats
```

**响应（注意没有 internalNotes 字段）：**

```json
[
  {
    "id": 1,
    "name": "Whiskers",
    "age": 3,
    "breed": "Persian",
    "description": "A fluffy white cat",
    "createdAt": "2025-11-06T12:00:00.000Z",
    "updatedAt": "2025-11-06T12:00:00.000Z"
  }
]
```

### 测试 POST /cats

```bash
curl -X POST http://localhost:8866/cats \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shadow",
    "age": 5,
    "breed": "British Shorthair",
    "description": "A grey cat"
  }'
```

**响应（注意没有 internalNotes 字段，即使后端保存了）：**

```json
{
  "id": 2,
  "name": "Shadow",
  "age": 5,
  "breed": "British Shorthair",
  "description": "A grey cat",
  "createdAt": "2025-11-06T12:05:00.000Z",
  "updatedAt": "2025-11-06T12:05:00.000Z"
}
```

---

## 🔥 高级用法

### 1. 不同接口返回不同字段

```typescript
// 列表接口：只返回基本信息
@Get()
async findAll(): Promise<CatSummaryResponseDto[]> {
  const cats = await this.prisma.cat.findMany();
  return cats.map(cat => catSummaryResponseSchema.parse(cat));
}

// 详情接口：返回完整信息
@Get(':id')
async findOne(@Param('id') id: number): Promise<CatResponseDto> {
  const cat = await this.prisma.cat.findUnique({ where: { id } });
  return catResponseSchema.parse(cat);
}
```

### 2. 添加计算字段

```typescript
// 在响应 DTO 中添加计算字段
export const catDetailResponseSchema = catResponseSchema.extend({
  ageCategory: z.enum(['kitten', 'adult', 'senior']),
  displayName: z.string(),
});

// 在服务中添加计算逻辑
async findOne(id: number): Promise<CatDetailResponseDto> {
  const cat = await this.prisma.cat.findUnique({ where: { id } });
  
  const ageCategory = cat.age < 1 ? 'kitten' 
    : cat.age < 7 ? 'adult' 
    : 'senior';
  
  return catDetailResponseSchema.parse({
    ...cat,
    ageCategory,
    displayName: `${cat.name} (${cat.breed})`,
  });
}
```

### 3. 条件性字段

```typescript
// 管理员可以看到更多字段
export const catAdminResponseSchema = CatSchema.omit({
  // 管理员不排除 internalNotes
});

// 根据用户角色返回不同的数据
async findOne(id: number, isAdmin: boolean): Promise<CatResponseDto | CatAdminResponseDto> {
  const cat = await this.prisma.cat.findUnique({ where: { id } });
  
  if (isAdmin) {
    return catAdminResponseSchema.parse(cat);
  }
  
  return catResponseSchema.parse(cat);
}
```

### 4. 分页响应

```typescript
async findAllPaginated(page: number, pageSize: number): Promise<CatListResponseDto> {
  const skip = (page - 1) * pageSize;
  
  const [cats, total] = await Promise.all([
    this.prisma.cat.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.cat.count(),
  ]);

  return catListResponseSchema.parse({
    data: cats.map(cat => catResponseSchema.parse(cat)),
    pageInfo: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page < Math.ceil(total / pageSize),
      hasPrevPage: page > 1,
    },
  });
}
```

### 5. 排除多个字段

```typescript
// 排除多个敏感字段
export const catPublicResponseSchema = CatSchema.omit({
  internalNotes: true,
  createdAt: true,      // 不显示创建时间
  updatedAt: true,      // 不显示更新时间
});
```

### 6. 部分字段（Pick）

```typescript
// 只包含指定的字段
export const catNameOnlySchema = CatSchema.pick({
  id: true,
  name: true,
});

// 用于自动完成等场景
async searchByName(query: string) {
  const cats = await this.prisma.cat.findMany({
    where: { name: { contains: query } },
  });
  
  return cats.map(cat => catNameOnlySchema.parse(cat));
}
```

---

## 📊 对比方案

### 方案 1: 使用 class-transformer 的 @Exclude

```typescript
// 需要在每个实体类中手动标记
export class Cat {
  id: number;
  name: string;
  age: number;
  
  @Exclude()  // 手动标记
  internalNotes: string;
}
```

**缺点**：
- ❌ 需要手动维护
- ❌ 容易遗漏
- ❌ 无法从 Prisma schema 自动生成

### 方案 2: 在 Prisma 查询时使用 select

```typescript
const cats = await this.prisma.cat.findMany({
  select: {
    id: true,
    name: true,
    age: true,
    breed: true,
    description: true,
    // 不包含 internalNotes
  },
});
```

**缺点**：
- ❌ 需要在每个查询中重复写
- ❌ 容易遗漏字段
- ❌ 维护成本高

### 方案 3: 使用 zod-prisma-types（推荐）✅

```typescript
// 自动生成 + 一次定义
export const catResponseSchema = CatSchema.omit({
  internalNotes: true,
});

return catResponseSchema.parse(cat);
```

**优点**：
- ✅ 自动从 Prisma schema 生成
- ✅ 类型安全
- ✅ 运行时验证
- ✅ 集中管理
- ✅ 易于维护

---

## 🎓 最佳实践

1. **集中管理响应 DTO**
   - 将所有响应 schema 放在 `dto/response.dto.ts`
   - 使用清晰的命名：`catResponseSchema`, `catSummaryResponseSchema` 等

2. **总是使用 parse 验证**
   - 在服务层使用 `schema.parse()` 验证数据
   - 确保返回的数据符合预期格式

3. **不同场景使用不同 schema**
   - 列表：使用 summary schema（少字段）
   - 详情：使用 full response schema（完整字段）
   - 管理员：使用 admin schema（包含敏感字段）

4. **定期重新生成**
   - 修改 Prisma schema 后记得运行 `pnpm dlx prisma generate`
   - 考虑在 CI/CD 中添加生成步骤

5. **错误处理**
   ```typescript
   try {
     return catResponseSchema.parse(cat);
   } catch (error) {
     // Zod 验证失败
     this.logger.error('Response validation failed', error);
     throw new InternalServerErrorException('Data validation error');
   }
   ```

---

## 🔧 故障排除

### 问题 1: 生成的 schema 文件不存在

**解决方案：**
```bash
pnpm dlx prisma generate
```

### 问题 2: TypeScript 找不到生成的类型

**解决方案：**
- 重启 TypeScript 服务器
- 检查 `tsconfig.json` 是否包含 `src/generated` 目录

### 问题 3: parse 时报错

**解决方案：**
- 检查数据库返回的数据格式
- 查看 Zod 的详细错误信息
- 确保 Prisma schema 和数据库同步

---

## 📚 相关资源

- [Zod 官方文档](https://zod.dev/)
- [zod-prisma-types GitHub](https://github.com/chrishoermann/zod-prisma-types)
- [Prisma 文档](https://www.prisma.io/docs)
- [NestJS 文档](https://docs.nestjs.com/)

---

**🎉 现在您可以安全地控制 API 返回值，防止敏感数据泄露！**

