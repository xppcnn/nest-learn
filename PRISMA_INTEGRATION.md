# Prisma 集成指南

## 概述

本项目已成功集成 Prisma ORM，用于数据库操作。Prisma 提供了类型安全的数据库访问、自动迁移管理和优秀的开发体验。

## 已完成的集成工作

### 1. 安装依赖

已安装以下 Prisma 相关包：
- `@prisma/client` - Prisma 客户端（dependencies）
- `prisma` - Prisma CLI 工具（devDependencies）

### 2. 项目结构

```
nest-learn/
├── prisma/
│   ├── schema.prisma      # Prisma schema 定义
│   ├── seed.ts            # 数据库种子文件
│   └── migrations/        # 数据库迁移文件（运行 migrate 后生成）
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts   # Prisma 模块
│   │   └── prisma.service.ts  # Prisma 服务
│   └── cats/
│       ├── cats.service.ts    # 已更新为使用 Prisma
│       └── ...
└── prisma.config.ts       # Prisma 配置文件
```

### 3. Prisma Schema

定义了 Cat 模型，映射到数据库的 `cats` 表：

```prisma
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

### 4. PrismaService

创建了封装 Prisma Client 的服务，处理数据库连接生命周期：

```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 5. PrismaModule

创建了全局 Prisma 模块，使 PrismaService 在整个应用中可用：

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 6. CatsService 更新

已将 CatsService 从内存存储迁移到使用 Prisma：

**之前（内存存储）：**
```typescript
private cats: Cat[] = [];

findAll(): Cat[] {
  return this.cats;
}
```

**现在（Prisma）：**
```typescript
constructor(
  private readonly prisma: PrismaService,
) {}

async findAll(): Promise<Cat[]> {
  const cats = await this.prisma.cat.findMany();
  return cats.map((cat) => new Cat(cat));
}
```

所有 CRUD 操作已更新：
- ✅ `findAll()` - 使用 `prisma.cat.findMany()`
- ✅ `findOne()` - 使用 `prisma.cat.findUnique()`
- ✅ `create()` - 使用 `prisma.cat.create()`
- ✅ `update()` - 使用 `prisma.cat.update()`
- ✅ `remove()` - 使用 `prisma.cat.delete()`

### 7. 环境变量

更新了环境变量验证，添加了 `DATABASE_URL`：

```typescript
const environmentSchema = z.object({
  PORT: z.string().min(1, 'PORT is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // ...
});
```

### 8. NPM Scripts

添加了 Prisma 相关的 npm 脚本：

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

## 使用指南

### 前置要求

1. **安装 PostgreSQL**
   - macOS: `brew install postgresql@14`
   - 或使用 Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

2. **配置环境变量**

创建 `.env` 文件（参考 `.env.example`）：

```env
PORT=8866
DATABASE_URL="postgresql://postgres:password@localhost:5432/nest_learn?schema=public"
```

### 数据库设置步骤

#### 1. 生成 Prisma Client

```bash
pnpm prisma:generate
# 或
npx prisma generate
```

#### 2. 创建数据库（如果不存在）

```bash
# 使用 psql 命令
psql -U postgres -c "CREATE DATABASE nest_learn;"
```

#### 3. 运行数据库迁移

```bash
pnpm prisma:migrate
# 或
npx prisma migrate dev --name init
```

这将：
- 创建数据库表结构
- 生成迁移文件在 `prisma/migrations/`
- 自动运行 `prisma generate`

#### 4. （可选）填充种子数据

```bash
pnpm prisma:seed
# 或
npx ts-node prisma/seed.ts
```

#### 5. 启动应用

```bash
pnpm start:dev
```

### Prisma Studio

Prisma Studio 是一个可视化数据库管理工具：

```bash
pnpm prisma:studio
# 或
npx prisma studio
```

访问 `http://localhost:5555` 查看和编辑数据库数据。

## 常用命令

### 开发环境

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 创建并运行迁移
pnpm prisma:migrate

# 打开 Prisma Studio
pnpm prisma:studio

# 运行种子数据
pnpm prisma:seed

# 重置数据库（⚠️ 删除所有数据）
npx prisma migrate reset
```

### 生产环境

```bash
# 部署迁移（不会创建新的迁移文件）
pnpm prisma:migrate:prod

# 或
npx prisma migrate deploy
```

## Schema 修改工作流

当你需要修改数据库结构时：

1. **修改 `prisma/schema.prisma`**

```prisma
model Cat {
  id            Int      @id @default(autoincrement())
  name          String
  age           Int
  breed         String
  description   String?
  color         String?  // 新增字段
  // ...
}
```

2. **创建迁移**

```bash
npx prisma migrate dev --name add_cat_color
```

3. **Prisma Client 会自动更新**

4. **更新 TypeScript 代码使用新字段**

```typescript
// DTO 也需要更新
export const createCatSchema = z.object({
  name: z.string(),
  age: z.coerce.number().int(),
  breed: z.string(),
  color: z.string().optional(), // 新增
  // ...
});
```

## Prisma 查询示例

### 基础查询

```typescript
// 查找所有
await this.prisma.cat.findMany();

// 查找一个
await this.prisma.cat.findUnique({ where: { id: 1 } });

// 条件查询
await this.prisma.cat.findMany({
  where: { 
    age: { gte: 3 },
    breed: 'Persian'
  }
});

// 分页
await this.prisma.cat.findMany({
  skip: 10,
  take: 10,
  orderBy: { createdAt: 'desc' }
});
```

### 创建和更新

```typescript
// 创建
await this.prisma.cat.create({
  data: {
    name: 'Whiskers',
    age: 3,
    breed: 'Persian'
  }
});

// 更新
await this.prisma.cat.update({
  where: { id: 1 },
  data: { age: 4 }
});

// Upsert（存在则更新，不存在则创建）
await this.prisma.cat.upsert({
  where: { id: 1 },
  update: { age: 4 },
  create: { name: 'New Cat', age: 2, breed: 'Siamese' }
});
```

### 删除

```typescript
// 删除一个
await this.prisma.cat.delete({ where: { id: 1 } });

// 删除多个
await this.prisma.cat.deleteMany({
  where: { age: { lt: 1 } }
});
```

### 聚合查询

```typescript
// 计数
const count = await this.prisma.cat.count();

// 聚合
const result = await this.prisma.cat.aggregate({
  _avg: { age: true },
  _max: { age: true },
  _min: { age: true },
});
```

## 最佳实践

### 1. 使用事务

对于需要多个操作的复杂业务逻辑：

```typescript
await this.prisma.$transaction(async (prisma) => {
  const cat = await prisma.cat.create({ data: {...} });
  await prisma.someOtherModel.update({...});
  return cat;
});
```

### 2. 错误处理

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

try {
  await this.prisma.cat.create({ data: {...} });
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      throw new ConflictException('Cat already exists');
    }
  }
  throw error;
}
```

### 3. 选择字段

提高性能，只选择需要的字段：

```typescript
await this.prisma.cat.findMany({
  select: {
    id: true,
    name: true,
    breed: true,
    // 不包含 internalNotes
  }
});
```

### 4. 关系查询

如果你有关联模型：

```typescript
// 包含关联数据
await this.prisma.cat.findMany({
  include: {
    owner: true, // 如果有 owner 关系
  }
});
```

## 测试

在测试中使用 Prisma：

```typescript
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';

describe('CatsService', () => {
  let service: CatsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CatsService, PrismaService],
    }).compile();

    service = module.get<CatsService>(CatsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 测试用例...
});
```

## 故障排查

### 问题：找不到 Prisma Client

**解决方案：**
```bash
npx prisma generate
```

### 问题：迁移失败

**解决方案：**
```bash
# 查看迁移状态
npx prisma migrate status

# 重置数据库（⚠️ 删除所有数据）
npx prisma migrate reset
```

### 问题：类型不匹配

**解决方案：**
确保 Prisma Client 是最新的：
```bash
npx prisma generate
```

### 问题：连接数据库失败

**检查：**
1. DATABASE_URL 是否正确
2. PostgreSQL 是否运行
3. 数据库是否存在
4. 用户权限是否正确

## 相关链接

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma + NestJS 指南](https://docs.nestjs.com/recipes/prisma)
- [Prisma Schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## 下一步

完成 Prisma 集成后，你可以：

1. ✅ 添加更多模型（User, Order, etc.）
2. ✅ 实现模型之间的关系（一对多、多对多）
3. ✅ 使用 Prisma 中间件进行日志记录或软删除
4. ✅ 集成全文搜索
5. ✅ 优化查询性能
6. ✅ 实现数据库缓存策略

## 总结

✅ **Prisma 已成功集成到 NestJS 项目！**

主要优势：
- 🎯 类型安全的数据库访问
- 🚀 自动生成的查询构建器
- 📝 清晰的 Schema 定义
- 🔧 简单的迁移管理
- 💡 优秀的 IDE 支持和自动补全
- 🐛 容易调试和测试

现在你的应用已经准备好使用 Prisma 进行生产级别的数据库操作了！

