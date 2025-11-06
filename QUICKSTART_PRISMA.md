# Prisma 快速开始指南

## 🚀 快速设置 Prisma

### 1. 安装 PostgreSQL

**使用 Docker（推荐）：**
```bash
docker run --name nest-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=nest_learn \
  -p 5432:5432 \
  -d postgres:14
```

**或使用 Homebrew (macOS)：**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb nest_learn
```

### 2. 配置环境变量

创建 `.env` 文件：
```bash
cat > .env << 'EOF'
PORT=8866
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/nest_learn?schema=public"
DATABASE_USER=postgres
DATABASE_PASSWORD=password
EOF
```

### 3. 生成 Prisma Client

```bash
pnpm prisma:generate
```

### 4. 运行数据库迁移

```bash
pnpm prisma:migrate
# 输入迁移名称，例如: init
```

### 5. （可选）填充测试数据

```bash
pnpm prisma:seed
```

### 6. 启动应用

```bash
pnpm start:dev
```

## 📝 测试 API

应用启动后，可以使用以下命令测试：

### 创建一只猫
```bash
curl -X POST http://localhost:8866/cats \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Whiskers",
    "age": 3,
    "breed": "Persian",
    "description": "A fluffy white cat"
  }'
```

### 获取所有猫
```bash
curl http://localhost:8866/cats
```

### 获取单只猫
```bash
curl http://localhost:8866/cats/1
```

### 更新猫信息
```bash
curl -X PATCH http://localhost:8866/cats/1 \
  -H "Content-Type: application/json" \
  -d '{"age": 4}'
```

### 删除猫
```bash
curl -X DELETE http://localhost:8866/cats/1
```

## 🎯 使用 Prisma Studio

可视化管理数据库：

```bash
pnpm prisma:studio
```

访问 `http://localhost:5555` 查看和编辑数据。

## 🔧 常见问题

### 问题：连接数据库失败

**检查 PostgreSQL 是否运行：**
```bash
# Docker
docker ps | grep nest-postgres

# Homebrew
brew services list | grep postgresql
```

### 问题：数据库不存在

**创建数据库：**
```bash
# 使用 psql
psql -U postgres -c "CREATE DATABASE nest_learn;"

# 或使用 createdb
createdb -U postgres nest_learn
```

### 问题：需要重置数据库

**警告：这会删除所有数据！**
```bash
npx prisma migrate reset
```

## 📚 下一步

- 阅读完整的 [PRISMA_INTEGRATION.md](./PRISMA_INTEGRATION.md)
- 查看 [Prisma 官方文档](https://www.prisma.io/docs)
- 探索 Prisma Studio 的功能

## ✅ 验证安装

运行以下命令确保一切正常：

```bash
# 检查 Prisma 版本
npx prisma version

# 查看数据库状态
npx prisma migrate status

# 构建项目
pnpm build

# 运行测试
pnpm test
```

如果所有命令都成功执行，说明 Prisma 已正确集成！🎉

