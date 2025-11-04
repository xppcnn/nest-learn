# NestJS 学习与生产级项目实战计划（ShopLite）

> 面向有 TypeScript 基础、希望以实战为抓手系统掌握 NestJS 的同学。
>
> 总时长建议：6–8 周（可按个人节奏调整）。

## 学习目标

- 掌握 NestJS 核心概念：模块、控制器、提供者、依赖注入、管道、守卫、过滤器、拦截器、生命周期。
- 能够搭建生产级后端：配置管理、鉴权与授权、数据库与迁移、缓存、任务队列、文件存储、日志与观测、测试、文档、CI/CD、部署与运维。
- 完成一个生产可用的电商子域后端（ShopLite）：商品、库存、订单、支付（第三方对接）、通知、Webhook、后台管理。

---

## 阶段化学习路线（建议 6–8 周）

### 第 1 周：NestJS 基础与项目骨架
- 内容：项目结构、模块化、控制器与提供者、依赖注入、管道/守卫/拦截器/过滤器、异常规范。
- 交付：完成应用骨架，约定错误返回结构与全局过滤器、全局验证管道。
- 关键词：`Module`、`Controller`、`Provider`、`ExceptionFilter`、`ValidationPipe`、`ClassSerializerInterceptor`。

### 第 2 周：配置、数据库与迁移
- 内容：`@nestjs/config` 配置与模式校验（Joi/Zod）、PostgreSQL、TypeORM、迁移、Repository 模式、事务基础。
- 交付：用户与角色表、基础数据迁移、`User` CRUD + DTO 验证。
- 关键词：`ConfigModule`、`TypeORM`、`migrations`、`DataSource`、`Transaction`。

### 第 3 周：认证与授权
- 内容：账号注册、登录、JWT（访问令牌/刷新令牌）、RBAC、`Guards` 与自定义装饰器。
- 交付：`/auth` 模块与 `/users` 受保护接口、权限装饰器与守卫落地。
- 关键词：`Passport`、`JWT`、`RolesGuard`、`@Roles()`、刷新令牌轮换。

### 第 4 周：业务域建模与性能
- 内容：商品、分类、库存；缓存（Redis）、限流、幂等性；列表分页/筛选/排序规范。
- 交付：`/products`、`/inventory` 模块，读多写少场景的缓存策略与失效方案。
- 关键词：`CacheModule`、`Redis`、`Throttler`、`Idempotency-Key`。

### 第 5 周：订单、支付与异步处理
- 内容：订单流程、支付意图、支付回调（Webhook）、Outbox/Saga 思想、队列任务与重试、邮件/短信通知。
- 交付：`/orders`、`/payments`、`/webhooks`、`/notifications` 模块与 BullMQ 队列。
- 关键词：`Bull`/`BullMQ`、`Webhook`、`Outbox`、`Retry`、`Idempotent`。

### 第 6 周：可观测性、测试与文档
- 内容：结构化日志、请求追踪（OpenTelemetry）、指标（Prometheus）、健康检查、Swagger 文档；单测/集成/E2E 测试。
- 交付：`/health` 模块、日志/指标接入、覆盖核心用例的 E2E 测试。
- 关键词：`pino`、`opentelemetry`、`@nestjs/terminus`、`@nestjs/swagger`、`supertest`。

### 第 7–8 周：安全与上线（可与第 6 周并行）
- 内容：安全头部、Helmet、序列化与输入净化、速率限制、CORS、CSRF（Cookie 场景）、依赖审计。
- 内容：容器化、Docker Compose、CI/CD（GitHub Actions）、多环境部署、版本与数据库迁移流水线。
- 交付：一键启动（docker compose）、CI 流水线、预发/线上部署指引。

---

## 实战项目（ShopLite）概述

- 类型：电商子域后端（单体模块化，可演进为微服务）。
- 功能范围：用户、角色/权限、商品与分类、库存、订单、支付（Stripe/Alipay/WeChat 的抽象适配器）、通知（邮件/短信/站内）、文件（S3 兼容）、Webhook 回调给外部系统、后台管理。
- 非功能性要求：
  - 稳定与可恢复：幂等性、队列重试、数据库迁移与回滚、观察性完善。
  - 性能与伸缩：缓存、分页/索引、异步化、可横向扩展。
  - 安全：鉴权授权、输入校验、速率限制、安全头、审计日志。

### 技术栈
- 运行时：Node.js + TypeScript + NestJS
- 数据库：PostgreSQL（可替换 MySQL）+ TypeORM（或 Prisma，本文以 TypeORM 为例）
- 缓存：Redis
- 队列：BullMQ（Redis 驱动）
- 存储：S3 兼容（MinIO/AWS S3）
- 日志：pino（JSON 结构化）
- 观测：OpenTelemetry + Prometheus 指标 + Health/Readiness 探针
- 文档：Swagger（OpenAPI）
- 测试：Jest + Supertest（E2E）
- 部署：Docker + Docker Compose，CI/CD（GitHub Actions）

---

## 系统架构与目录结构（建议）

```
src/
  main.ts
  app.module.ts
  configs/                  # 配置与校验（env schema）
  common/                   # 公共层（异常过滤器、拦截器、守卫、装饰器、pipes、utils）
    exceptions/
    interceptors/
    guards/
    decorators/
    pipes/
  infra/                    # 基础设施（db、cache、queue、mailer、storage、logger）
    database/
    cache/
    queue/
    mailer/
    storage/
    logger/
  modules/
    auth/
    users/
    roles/
    products/
    categories/
    inventory/
    orders/
    payments/
    webhooks/
    notifications/
    files/
    admin/
    health/
  libs/                     # 领域无关库（分页、结果封装、日期、id 生成等）
  tests/                    # e2e 测试
```

- API 版本：`/v1/...`，为重大升级预留 `/v2`。
- 错误返回统一：`{ code, message, details?, traceId }`。
- 分页：`?limit=...&cursor=...` 或 `?page=...&pageSize=...`，推荐 cursor。
- 幂等性：重要写接口支持 `Idempotency-Key` 请求头；支付/回调默认幂等。

---

## 配置与环境

- 环境变量（示例）：
  - `NODE_ENV`：`development|staging|production`
  - `PORT`：HTTP 端口
  - `DATABASE_URL`：Postgres 连接串
  - `REDIS_URL`：Redis 连接串
  - `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`、`JWT_ACCESS_TTL`、`JWT_REFRESH_TTL`
  - `S3_ENDPOINT`、`S3_ACCESS_KEY`、`S3_SECRET_KEY`、`S3_BUCKET`
  - `STRIPE_SECRET_KEY`（或其他支付网关密钥）
  - `OTEL_EXPORTER_OTLP_ENDPOINT`（可选）

- 建议使用 `@nestjs/config` + Joi 对 env 做强校验；按环境加载配置，并统一通过 `ConfigService` 读取。

---

## 数据模型草图（简要）

- 用户与权限
  - `User(id, email, passwordHash, status, createdAt, updatedAt)`
  - `Role(id, name)`、`Permission(id, name)`、`UserRole(userId, roleId)`、`RolePermission(roleId, permissionId)`
  - `RefreshToken(id, userId, tokenHash, expiresAt, revokedAt)`
- 商品与库存
  - `Product(id, name, slug, price, currency, status, ... )`
  - `Category(id, name, parentId)`、`ProductCategory(productId, categoryId)`
  - `InventoryItem(id, productId, sku, quantity, reservedQuantity)`
- 订单与支付
  - `Order(id, userId, status, totalAmount, currency, addressId, ... )`
  - `OrderItem(id, orderId, productId, price, quantity)`
  - `Payment(id, orderId, provider, status, amount, currency, idempotencyKey)`
  - `PaymentAttempt(id, paymentId, providerRef, status, errorCode?, errorMsg?)`
- 其他
  - `Address(id, userId, ... )`、`FileObject(id, key, url, mimeType, size)`
  - `WebhookEvent(id, topic, payload, status, retryCount)`
  - `AuditLog(id, actorId, action, resource, meta)`

说明：
- 关键写路径（如下单、支付确认）需设计成可回溯且幂等；失败可重放。
- 重要表留审计字段与软删除（`deletedAt`）。

---

## API 设计清单（V1）

说明：以下为主接口清单与职责边界。详细请求/响应 DTO、错误码与权限矩阵请在实现阶段细化至 Swagger。

### 认证与账号（Auth）
- `POST /v1/auth/register`：注册（邮箱/手机）
- `POST /v1/auth/login`：登录，返回 `accessToken`、`refreshToken`
- `POST /v1/auth/refresh`：刷新令牌（轮换刷新令牌）
- `POST /v1/auth/logout`：登出并失效刷新令牌
- `POST /v1/auth/forgot-password`、`POST /v1/auth/reset-password`
- `GET /v1/auth/me`：获取当前用户信息

### 用户与权限（Users & Roles）
- `GET /v1/users`（admin）列表
- `POST /v1/users`（admin）创建
- `GET /v1/users/:id` 获取
- `PATCH /v1/users/:id` 更新
- `DELETE /v1/users/:id` 软删除
- `GET /v1/roles`、`POST /v1/roles`、`PATCH /v1/roles/:id`、`DELETE /v1/roles/:id`
- `GET /v1/permissions`（admin）

### 商品与分类（Products & Categories）
- `GET /v1/products`（支持分页/筛选/排序/全文检索可选）
- `POST /v1/products`（admin）
- `GET /v1/products/:id`
- `PATCH /v1/products/:id`（admin）
- `DELETE /v1/products/:id`（admin）
- `GET /v1/categories`、`POST /v1/categories`、`PATCH /v1/categories/:id`、`DELETE /v1/categories/:id`
- `POST /v1/products/:id/images/presign`：获取上传签名 URL（S3）

### 库存（Inventory）
- `GET /v1/inventory/:productId` 查询现货与预留
- `POST /v1/inventory/:productId/adjust`（admin）增减库存
- `POST /v1/inventory/reserve` 在下单前预留库存（幂等）

### 订单（Orders）
- `POST /v1/orders` 创建订单（校验库存、计算价格、预留库存）[支持 Idempotency-Key]
- `GET /v1/orders` 列表（用户看到自己，admin 全量）
- `GET /v1/orders/:id` 详情
- `POST /v1/orders/:id/cancel` 取消（释放库存、对账）

### 支付（Payments）
- `POST /v1/payments/:orderId/intent` 创建支付意图（返回第三方支付所需信息）
- `POST /v1/payments/:orderId/confirm` 客户端确认回传（可选，依 provider）
- `GET /v1/payments/:orderId` 查询支付状态
- `POST /v1/webhooks/payments/:provider` 支付回调（public，签名校验，幂等）

### 通知（Notifications）
- `POST /v1/notifications/email`（admin）触发（内部场景使用队列）
- `POST /v1/notifications/sms`（admin）触发

### 文件（Files）
- `POST /v1/files/presign` 获取上传签名（S3）
- `GET /v1/files/:id` 元数据

### 运维（Ops）
- `GET /v1/health` 健康检查
- `GET /v1/metrics` 指标（受保护或另暴露端口）
- `GET /v1/version` 版本信息

> 请求/响应规范建议：
> - 成功：`{ data, meta? }`
> - 失败：`{ code, message, details?, traceId }`
> - 分页：`{ data, pageInfo: { nextCursor?, prevCursor?, total? } }`

---

## 关键横切关注点

- 验证与序列化：`class-validator`、`class-transformer`，全局开启 `whitelist`。
- 鉴权：`Passport JWT`，访问/刷新双令牌，刷新轮换与撤销表。
- RBAC：`@Roles()` 装饰器 + `RolesGuard`，权限矩阵归档。
- 缓存：查询热点数据（商品列表等）；写路径触发失效；使用 Redis。
- 幂等性：下单、支付、Webhook 回调等写接口强制校验 `Idempotency-Key`。
- 队列：发送邮件/短信、对账、重试与死信策略。
- 事务：下单（订单 + 订单项 + 库存预留）采用事务，或 outbox 模式保证最终一致。
- 日志：pino，记录 `traceId`、`userId`、关键业务字段。
- 观测：OpenTelemetry trace；Prometheus 指标（QPS、错误率、队列深度、延迟分布）。
- 文档：Swagger，按模块分组；DTO 示例完善；错误码对照表。
- 错误处理：统一异常过滤器，映射到业务错误码；敏感信息不外泄。

---

## 实施步骤（Step by Step）

> 可按里程碑分支推进，每步都可运行/可回滚/可验证。

1) 初始化与基础设施
- 新增 `@nestjs/config`、`class-validator`、`class-transformer`、`typeorm`、`pg`、`cache-manager`、`ioredis`、`bullmq`、`@nestjs/bullmq`、`pino`、`@nestjs/swagger`。
- 建立 `ConfigModule`，对 env 进行 Joi 校验。
- 建立全局 `ValidationPipe`、`HttpExceptionFilter`、`ClassSerializerInterceptor`。
- 接入 TypeORM，配置 DataSource 与迁移命令。

2) 用户与权限
- 实体：`User`、`Role`、`Permission`、关系表与迁移。
- 模块：`users`、`roles`，提供 CRUD 与分页。

3) 认证
- 模块：`auth`，注册/登录/刷新/登出；刷新令牌持久化与撤销。
- 守卫：`JwtAuthGuard`、`RolesGuard`；装饰器：`@CurrentUser()`、`@Roles()`。

4) 商品与分类
- 模块：`products`、`categories`；DTO、分页过滤、缓存读路径；图片上传 presign。

5) 库存
- 模块：`inventory`；库存查询、预留、调整；与下单事务集成。

6) 订单
- 模块：`orders`；创建/查询/取消；计算价格、校验库存；幂等与事务。

7) 支付与回调
- 模块：`payments`、`webhooks`；支付意图、确认、状态轮询；回调签名校验与幂等；队列落库。

8) 通知与文件
- 模块：`notifications`（email/sms 适配器 + 队列）、`files`（S3 服务）。

9) 观测与健康
- 模块：`health`；接入 pino 日志、OpenTelemetry、Prometheus 指标；`/metrics` 暴露。

10) 测试与文档
- E2E 测试覆盖核心流程（注册-登录-下单-支付回调）；Swagger 文档完善；错误码表校准。

11) CI/CD 与部署
- Dockerfile、docker-compose（postgres/redis/minio/grafana 可选）；
- GitHub Actions：lint/test/build、迁移、分支策略、环境注入；
- 预发/线上环境变量与密钥管理（GitHub Environments/Secrets）。

---

## 命令与本地环境（示例）

```bash
# 数据库与缓存（示例 docker compose）
docker compose up -d postgres redis minio

# TypeORM 迁移
pnpm typeorm migration:generate -n init
pnpm typeorm migration:run

# 运行
pnpm start:dev

# E2E 测试
pnpm test:e2e
```

> 提示：确保 `ValidationPipe` 开启 `transform: true, whitelist: true`，并在 `main.ts` 挂载全局过滤器与拦截器。

---

## 学习资源推荐

- 官方文档：NestJS（`https://docs.nestjs.com/`）
- 认证：Passport + JWT（Nest 文档章节）
- ORM：TypeORM（`https://typeorm.io/`）或 Prisma（`https://www.prisma.io/`）
- 观测：OpenTelemetry（`https://opentelemetry.io/`）
- 队列：BullMQ（`https://docs.bullmq.io/`）
- 文档：Swagger（`https://swagger.io/specification/`）

---

## 验收与里程碑

- M1（基础）：骨架 + 配置 + 用户/权限 + 认证，可本地启动。
- M2（业务）：商品/库存/订单/支付（沙箱）闭环跑通，含回调与幂等。
- M3（可观测）：结构化日志 + 指标 + 健康检查 + E2E。
- M4（上线）：Docker 化 + CI/CD + 预发/线上部署指引。

完成以上，你将具备从 0 到 1 设计并交付生产级 NestJS 后端的能力。

