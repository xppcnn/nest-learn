# Prisma 使用指南

本指南介绍如何在 NestJS 项目中使用 Prisma ORM。

## 📋 目录

1. [快速开始](#快速开始)
2. [数据库设置](#数据库设置)
3. [常用命令](#常用命令)
4. [在服务中使用 Prisma](#在服务中使用-prisma)
5. [Schema 管理](#schema-管理)
6. [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 1. 配置环境变量

创建 `.env` 或 `.env.development` 文件：

```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/nest_learn_db?schema=public"
```

### 2. 生成 Prisma 客户端

```bash
pnpm dlx prisma generate
```

### 3. 同步数据库结构

```bash
# 开发环境：直接推送 schema（不创建迁移文件）
pnpm dlx prisma db push

# 生产环境：创建迁移文件
pnpm run prisma:migrate
```

### 4. 插入测试数据

```bash
pnpm run prisma:seed
```

### 5. 启动应用

```bash
pnpm run start:dev
```

---

## 🗄️ 数据库设置

### PostgreSQL 安装

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Docker:**
```bash
docker run --name postgres-nest \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=nest_learn_db \
  -p 5432:5432 \
  -d postgres:15
```

### 创建数据库

```bash
# 方法1：使用 createdb 命令
createdb nest_learn_db

# 方法2：使用 psql
psql -c "CREATE DATABASE nest_learn_db;"
```

---

## 🛠️ 常用命令

### Prisma CLI 命令

```bash
# 生成 Prisma 客户端
pnpm dlx prisma generate

# 推送 schema 到数据库（开发环境）
pnpm dlx prisma db push

# 创建迁移（生产环境）
pnpm dlx prisma migrate dev --name init

# 应用迁移（生产环境）
pnpm dlx prisma migrate deploy

# 查看数据库
pnpm dlx prisma studio

# 格式化 schema 文件
pnpm dlx prisma format

# 验证 schema
pnpm dlx prisma validate

# 重置数据库（⚠️ 删除所有数据）
pnpm dlx prisma migrate reset
```

### 项目自定义命令

在 `package.json` 中已配置：

```bash
# 生成客户端
pnpm run prisma:generate

# 创建迁移
pnpm run prisma:migrate

# 应用迁移（生产）
pnpm run prisma:migrate:prod

# 启动 Prisma Studio
pnpm run prisma:studio

# 插入种子数据
pnpm run prisma:seed
```

---

## 💻 在服务中使用 Prisma

### 注入 PrismaService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatsService {
  constructor(private readonly prisma: PrismaService) {}

  // ... 方法实现
}
```

### CRUD 操作示例

#### 查询所有记录

```typescript
async findAll() {
  return await this.prisma.cat.findMany({
    orderBy: { createdAt: 'desc' },
  });
}
```

#### 分页查询

```typescript
async findAllPaginated(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  
  const [data, total] = await Promise.all([
    this.prisma.cat.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.cat.count(),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

#### 查询单条记录

```typescript
async findOne(id: number) {
  return await this.prisma.cat.findUnique({
    where: { id },
  });
}
```

#### 条件查询

```typescript
async findByBreed(breed: string) {
  return await this.prisma.cat.findMany({
    where: { breed },
  });
}

async findByAge(minAge: number, maxAge: number) {
  return await this.prisma.cat.findMany({
    where: {
      age: {
        gte: minAge,
        lte: maxAge,
      },
    },
  });
}
```

#### 创建记录

```typescript
async create(createCatDto: CreateCatDto) {
  return await this.prisma.cat.create({
    data: createCatDto,
  });
}
```

#### 更新记录

```typescript
async update(id: number, updateCatDto: UpdateCatDto) {
  return await this.prisma.cat.update({
    where: { id },
    data: updateCatDto,
  });
}
```

#### 删除记录

```typescript
async remove(id: number) {
  return await this.prisma.cat.delete({
    where: { id },
  });
}
```

#### 批量操作

```typescript
// 批量创建
async createMany(cats: CreateCatDto[]) {
  return await this.prisma.cat.createMany({
    data: cats,
    skipDuplicates: true, // 跳过重复记录
  });
}

// 批量更新
async updateMany(breed: string, data: UpdateCatDto) {
  return await this.prisma.cat.updateMany({
    where: { breed },
    data,
  });
}

// 批量删除
async removeByBreed(breed: string) {
  return await this.prisma.cat.deleteMany({
    where: { breed },
  });
}
```

#### 事务操作

```typescript
async transferCat(fromOwnerId: number, toOwnerId: number, catId: number) {
  return await this.prisma.$transaction(async (prisma) => {
    // 操作1：更新猫的所有者
    const cat = await prisma.cat.update({
      where: { id: catId },
      data: { ownerId: toOwnerId },
    });

    // 操作2：记录转移历史
    const history = await prisma.transferHistory.create({
      data: {
        catId,
        fromOwnerId,
        toOwnerId,
      },
    });

    return { cat, history };
  });
}
```

---

## 📝 Schema 管理

### 定义模型

编辑 `prisma/schema.prisma`：

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

  @@map("cats")  // 映射到数据库表名
}
```

### 数据类型映射

| Prisma 类型 | PostgreSQL 类型 | TypeScript 类型 |
|------------|----------------|----------------|
| String     | TEXT           | string         |
| Int        | INTEGER        | number         |
| BigInt     | BIGINT         | bigint         |
| Float      | DOUBLE PRECISION | number       |
| Decimal    | DECIMAL        | Decimal        |
| Boolean    | BOOLEAN        | boolean        |
| DateTime   | TIMESTAMP      | Date           |
| Json       | JSONB          | any            |
| Bytes      | BYTEA          | Buffer         |

### 常用字段修饰符

```prisma
model Example {
  // 主键
  id        Int      @id @default(autoincrement())
  
  // UUID 主键
  uuid      String   @id @default(uuid())
  
  // 唯一约束
  email     String   @unique
  
  // 可选字段
  bio       String?
  
  // 默认值
  isActive  Boolean  @default(true)
  
  // 自动时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 索引
  @@index([email])
  
  // 复合唯一约束
  @@unique([firstName, lastName])
  
  // 表名映射
  @@map("examples")
}
```

### 关系定义

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  cats  Cat[]  // 一对多关系
  
  @@map("users")
}

model Cat {
  id      Int    @id @default(autoincrement())
  name    String
  ownerId Int
  owner   User   @relation(fields: [ownerId], references: [id])
  
  @@map("cats")
}
```

---

## ✨ 最佳实践

### 1. 使用事务保证数据一致性

```typescript
// ✅ 好的做法
await this.prisma.$transaction([
  this.prisma.cat.create({ data: catData }),
  this.prisma.owner.update({ where: { id: ownerId }, data: { catCount: { increment: 1 } } }),
]);

// ❌ 避免
await this.prisma.cat.create({ data: catData });
await this.prisma.owner.update({ where: { id: ownerId }, data: { catCount: { increment: 1 } } });
```

### 2. 使用 select 优化查询

```typescript
// ✅ 只查询需要的字段
const cat = await this.prisma.cat.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    breed: true,
  },
});

// ❌ 查询所有字段
const cat = await this.prisma.cat.findUnique({
  where: { id },
});
```

### 3. 使用 include 处理关联数据

```typescript
const cat = await this.prisma.cat.findUnique({
  where: { id },
  include: {
    owner: true,
    vaccinations: true,
  },
});
```

### 4. 错误处理

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

try {
  await this.prisma.cat.create({ data });
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // 唯一约束冲突
      throw new ConflictException('Cat with this name already exists');
    }
  }
  throw error;
}
```

### 5. 环境隔离

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```env
# .env.development
DATABASE_URL="postgresql://user:pass@localhost:5432/nest_learn_dev"

# .env.production
DATABASE_URL="postgresql://user:pass@prod-server:5432/nest_learn_prod"
```

---

## 🔍 常见问题

### 1. 表不存在错误

**错误信息：** `The table 'public.cats' does not exist in the current database.`

**解决方案：**
```bash
pnpm dlx prisma db push
```

### 2. Prisma Client 未生成

**错误信息：** `Cannot find module '@prisma/client'`

**解决方案：**
```bash
pnpm dlx prisma generate
```

### 3. 环境变量未加载

**错误信息：** `Missing required environment variable: DATABASE_URL`

**解决方案：**
- 确保 `.env` 或 `.env.development` 文件存在
- 检查文件中是否包含 `DATABASE_URL`
- 确认 `ConfigModule.forRoot()` 配置正确

### 4. 迁移冲突

**解决方案：**
```bash
# 重置数据库（⚠️ 会删除所有数据）
pnpm dlx prisma migrate reset

# 或手动解决冲突后
pnpm dlx prisma migrate resolve --applied <migration_name>
```

---

## 📚 更多资源

- [Prisma 官方文档](https://www.prisma.io/docs)
- [NestJS Prisma 集成](https://docs.nestjs.com/recipes/prisma)
- [Prisma Schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

---

**🎉 现在您可以开始使用 Prisma 了！**

如有问题，请查看日志文件或运行：
```bash
pnpm dlx prisma studio
```

