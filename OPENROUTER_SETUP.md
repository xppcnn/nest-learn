# OpenRouter 集成指南

本项目使用 OpenRouter 作为 AI 提供商，通过 OpenRouter 可以访问多个 AI 模型。

## 🎯 什么是 OpenRouter？

OpenRouter 是一个统一的 API 网关，让您可以通过一个 API 访问多个 AI 模型提供商：
- ✅ OpenAI (GPT-4, GPT-3.5, etc.)
- ✅ Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
- ✅ Google (Gemini Pro, etc.)
- ✅ Meta (Llama 3, etc.)
- ✅ 更多...

## 📋 配置步骤

### 1. 获取 API Key

1. 访问 [OpenRouter.ai](https://openrouter.ai/)
2. 注册账户
3. 进入 [Keys 页面](https://openrouter.ai/keys)
4. 创建新的 API Key

### 2. 配置环境变量

在 `.env` 或 `.env.development` 文件中添加：

```env
# OpenRouter 配置
OPENROUTER_API_KEY=sk-or-v1-your_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet  # 可选，默认值
OPENROUTER_REFERER=http://localhost:8866       # 可选
OPENROUTER_APP_NAME=NestJS App                 # 可选
```

### 3. 选择模型

OpenRouter 支持多种模型，您可以通过设置 `OPENROUTER_MODEL` 来选择：

#### 推荐模型

```env
# Anthropic Claude 3.5 Sonnet（推荐，性价比高）
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# OpenAI GPT-4o（最新，功能强大）
OPENROUTER_MODEL=openai/gpt-4o

# OpenAI GPT-4o Mini（经济实惠）
OPENROUTER_MODEL=openai/gpt-4o-mini

# Google Gemini Pro
OPENROUTER_MODEL=google/gemini-pro

# Meta Llama 3
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
```

完整模型列表：https://openrouter.ai/models

---

## 🚀 使用示例

### 基本使用

配置完成后，所有 AI 接口都会使用 OpenRouter：

```bash
# 测试聊天
curl -X POST http://localhost:8866/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，介绍一下自己"}'
```

### 多模型配置（高级）

如果需要在应用中同时使用多个模型，可以扩展 `AiService`：

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class AiService {
  private claudeModel: ChatOpenAI;
  private gptModel: ChatOpenAI;

  constructor(private readonly configService: ConfigService) {
    // Claude 3.5 Sonnet
    this.claudeModel = new ChatOpenAI({
      modelName: 'anthropic/claude-3.5-sonnet',
      openAIApiKey: this.configService.get('OPENROUTER_API_KEY'),
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    // GPT-4o
    this.gptModel = new ChatOpenAI({
      modelName: 'openai/gpt-4o',
      openAIApiKey: this.configService.get('OPENROUTER_API_KEY'),
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });
  }

  async chatWithClaude(message: string) {
    return await this.claudeModel.invoke(message);
  }

  async chatWithGPT(message: string) {
    return await this.gptModel.invoke(message);
  }
}
```

---

## 💰 定价和计费

### 按使用付费

OpenRouter 采用按使用付费的模式，不同模型价格不同：

| 模型 | 输入价格 (每百万 tokens) | 输出价格 (每百万 tokens) |
|------|-------------------------|-------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| GPT-4o | $5.00 | $15.00 |
| GPT-4o Mini | $0.15 | $0.60 |
| Gemini Pro | $0.50 | $1.50 |

查看实时价格：https://openrouter.ai/models

### 充值

1. 访问 [Credits 页面](https://openrouter.ai/credits)
2. 选择充值金额（最低 $5）
3. 支持信用卡和加密货币

### 监控使用量

在 [Activity 页面](https://openrouter.ai/activity) 可以查看：
- 每次请求的详细信息
- 使用的 tokens 数量
- 花费金额
- 请求耗时

---

## 🔧 配置说明

### baseURL

```typescript
baseURL: 'https://openrouter.ai/api/v1'
```

这是 OpenRouter 的 API 端点，兼容 OpenAI API 格式。

### defaultHeaders

```typescript
defaultHeaders: {
  'HTTP-Referer': 'http://localhost:8866',  // 您的应用 URL
  'X-Title': 'NestJS App',                   // 应用名称
}
```

这些 headers 帮助 OpenRouter：
- 追踪请求来源
- 在仪表板中显示应用名称
- 用于统计和分析

---

## 📊 模型对比

### Claude 3.5 Sonnet（推荐）

**优点：**
- ✅ 性价比高
- ✅ 响应质量优秀
- ✅ 支持长上下文（200K tokens）
- ✅ 代码能力强

**适用场景：**
- 复杂推理任务
- 代码生成和审查
- 长文本处理

### GPT-4o Mini

**优点：**
- ✅ 价格便宜
- ✅ 响应速度快
- ✅ 适合简单任务

**适用场景：**
- 简单问答
- 文本分类
- 内容总结

### GPT-4o

**优点：**
- ✅ 功能最强大
- ✅ 多模态支持
- ✅ 最新特性

**适用场景：**
- 需要最高质量的输出
- 复杂的创作任务
- 多模态处理

---

## 🔒 安全最佳实践

### 1. 保护 API Key

```bash
# ❌ 不要提交到版本控制
git add .env  # 危险！

# ✅ 使用 .gitignore
echo ".env" >> .gitignore
echo ".env.development" >> .gitignore
```

### 2. 使用环境变量

```typescript
// ❌ 不要硬编码
const apiKey = 'sk-or-v1-xxx';

// ✅ 使用 ConfigService
const apiKey = this.configService.get('OPENROUTER_API_KEY');
```

### 3. 限制请求频率

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('ai')
export class AiController {
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('chat')
  async chat() {
    // 每分钟最多 10 次请求
  }
}
```

### 4. 监控异常使用

定期检查 OpenRouter 仪表板的使用情况，设置预算警报。

---

## 🐛 常见问题

### 1. 401 Unauthorized

**原因：** API Key 无效或未配置

**解决方案：**
```bash
# 检查环境变量
echo $OPENROUTER_API_KEY

# 确保 .env 文件存在且正确
cat .env | grep OPENROUTER_API_KEY
```

### 2. 429 Too Many Requests

**原因：** 请求频率过高

**解决方案：**
- 实现请求节流
- 使用请求队列
- 增加重试逻辑

### 3. 模型不存在

**原因：** 模型名称错误

**解决方案：**
```env
# 确保模型名称正确
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet  # ✅ 正确
OPENROUTER_MODEL=claude-3.5-sonnet            # ❌ 错误
```

### 4. 余额不足

**原因：** OpenRouter 账户余额为 0

**解决方案：**
- 访问 https://openrouter.ai/credits 充值
- 最低充值金额 $5

---

## 🔄 从 OpenAI 迁移

如果您之前使用 OpenAI，迁移到 OpenRouter 很简单：

### 之前（OpenAI）

```typescript
this.chatModel = new ChatOpenAI({
  modelName: 'gpt-4',
  openAIApiKey: process.env.OPENAI_API_KEY,
});
```

### 现在（OpenRouter）

```typescript
this.chatModel = new ChatOpenAI({
  modelName: 'openai/gpt-4',  // 加上提供商前缀
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
});
```

---

## 📚 有用的链接

- [OpenRouter 官网](https://openrouter.ai/)
- [模型列表](https://openrouter.ai/models)
- [API 文档](https://openrouter.ai/docs)
- [定价信息](https://openrouter.ai/models)
- [使用统计](https://openrouter.ai/activity)
- [API Keys 管理](https://openrouter.ai/keys)

---

## 💡 提示

1. **选择合适的模型**
   - 开发/测试：使用便宜的模型（GPT-4o Mini）
   - 生产环境：根据需求选择（Claude 3.5 Sonnet 性价比高）

2. **优化成本**
   - 实现缓存机制
   - 限制 maxTokens
   - 使用流式响应时及时断开

3. **监控使用**
   - 定期查看 Activity 页面
   - 设置月度预算
   - 追踪异常使用模式

---

**🎉 现在您可以通过 OpenRouter 使用多个 AI 模型了！**

