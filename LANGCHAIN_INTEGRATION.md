# LangChain.js 集成指南

本项目已成功集成 LangChain.js，提供强大的 AI 功能。

## 📋 目录

1. [安装的依赖](#安装的依赖)
2. [环境配置](#环境配置)
3. [API 接口](#api-接口)
4. [使用示例](#使用示例)
5. [在其他模块中使用](#在其他模块中使用)
6. [高级功能](#高级功能)

---

## 📦 安装的依赖

```json
{
  "langchain": "^1.0.4",
  "@langchain/openai": "^1.1.0",
  "@langchain/community": "^1.0.2",
  "@langchain/core": "^1.0.4"
}
```

---

## 🔧 环境配置

在 `.env` 或 `.env.development` 文件中添加：

```env
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # 可选，默认 gpt-4o-mini
```

---

## 🚀 API 接口

所有接口都在 `/ai` 路径下。

### 1. 简单聊天

**接口：** `POST /ai/chat`

**请求体：**
```json
{
  "message": "你好，请介绍一下 NestJS"
}
```

**响应：**
```json
{
  "response": "NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架..."
}
```

### 2. 使用模板的聊天

**接口：** `POST /ai/chat/template`

**请求体：**
```json
{
  "message": "如何优化 TypeScript 性能？",
  "context": "我在开发一个大型企业应用"
}
```

**响应：**
```json
{
  "response": "针对大型企业应用的 TypeScript 性能优化建议..."
}
```

### 3. 文本总结

**接口：** `POST /ai/summarize`

**请求体：**
```json
{
  "text": "很长的文本内容..."
}
```

**响应：**
```json
{
  "summary": "总结后的内容..."
}
```

### 4. 文本翻译

**接口：** `POST /ai/translate`

**请求体：**
```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "Chinese"
}
```

**响应：**
```json
{
  "translation": "你好，你好吗？"
}
```

### 5. 代码解释

**接口：** `POST /ai/explain-code`

**请求体：**
```json
{
  "code": "const add = (a: number, b: number) => a + b;",
  "language": "TypeScript"
}
```

**响应：**
```json
{
  "explanation": "这是一个箭头函数，用于将两个数字相加..."
}
```

### 6. 流式聊天（SSE）

**接口：** `POST /ai/chat/stream`

**请求体：**
```json
{
  "message": "讲一个故事"
}
```

**响应：** Server-Sent Events 流式数据

---

## 💡 使用示例

### cURL 示例

```bash
# 简单聊天
curl -X POST http://localhost:8866/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'

# 代码解释
curl -X POST http://localhost:8866/ai/explain-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "async function fetchData() { return await fetch(\"/api/data\"); }",
    "language": "TypeScript"
  }'

# 翻译
curl -X POST http://localhost:8866/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Good morning!",
    "targetLanguage": "Chinese"
  }'
```

### JavaScript/Fetch 示例

```javascript
// 聊天
async function chat(message) {
  const response = await fetch('http://localhost:8866/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await response.json();
  console.log(data.response);
}

chat('什么是 LangChain？');

// 流式聊天
const eventSource = new EventSource('http://localhost:8866/ai/chat/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};
```

### Postman 示例

1. 创建新请求
2. 方法：POST
3. URL：`http://localhost:8866/ai/chat`
4. Headers：`Content-Type: application/json`
5. Body（raw JSON）：
```json
{
  "message": "解释一下什么是微服务架构"
}
```

---

## 🔌 在其他模块中使用

### 注入 AiService

```typescript
import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MyService {
  constructor(private readonly aiService: AiService) {}

  async processWithAi(text: string) {
    // 使用 AI 总结
    const summary = await this.aiService.summarize(text);
    
    // 使用 AI 翻译
    const translation = await this.aiService.translate(text, 'English');
    
    return { summary, translation };
  }
}
```

### 在模块中导入

```typescript
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { MyService } from './my.service';

@Module({
  imports: [AiModule],
  providers: [MyService],
})
export class MyModule {}
```

---

## 🚀 高级功能

### 1. 自定义 Prompt Template

在 `AiService` 中添加自定义方法：

```typescript
async customAnalysis(data: any): Promise<string> {
  const promptTemplate = PromptTemplate.fromTemplate(
    `Analyze the following data and provide insights:
    
    Data: {data}
    
    Please provide:
    1. Key observations
    2. Recommendations
    3. Potential risks
    
    Analysis:`
  );

  const chain = promptTemplate
    .pipe(this.chatModel)
    .pipe(new StringOutputParser());

  return await chain.invoke({ data: JSON.stringify(data) });
}
```

### 2. Chain 组合

```typescript
async complexTask(input: string): Promise<string> {
  // 步骤1：总结
  const summary = await this.summarize(input);
  
  // 步骤2：基于总结生成建议
  const promptTemplate = PromptTemplate.fromTemplate(
    `Based on this summary: {summary}
    
    Provide 5 actionable recommendations.`
  );

  const chain = promptTemplate
    .pipe(this.chatModel)
    .pipe(new StringOutputParser());

  return await chain.invoke({ summary });
}
```

### 3. 错误处理和重试

```typescript
async chatWithRetry(message: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.chat(message);
    } catch (error) {
      this.logger.warn({ attempt: i + 1, error }, 'Chat failed, retrying...');
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 4. 流式响应处理

```typescript
async processStream(message: string): Promise<string> {
  let fullResponse = '';
  
  for await (const chunk of this.chatStream(message)) {
    fullResponse += chunk;
    // 可以在这里做实时处理
    console.log('Received chunk:', chunk);
  }
  
  return fullResponse;
}
```

---

## 🎨 实际应用场景

### 1. 智能客服

```typescript
@Post('customer-service')
async customerService(@Body() { question }: { question: string }) {
  const context = `You are a helpful customer service assistant for an e-commerce platform.
  Be polite, professional, and provide accurate information.`;
  
  return await this.aiService.chatWithTemplate(question, context);
}
```

### 2. 代码审查助手

```typescript
@Post('code-review')
async codeReview(@Body() { code }: { code: string }) {
  const explanation = await this.aiService.explainCode(code);
  
  return {
    explanation,
    suggestions: 'Based on the code analysis...'
  };
}
```

### 3. 内容生成

```typescript
@Post('generate-content')
async generateContent(@Body() { topic, style }: { topic: string; style: string }) {
  const context = `Generate ${style} content about the following topic.
  Make it engaging and informative.`;
  
  return await this.aiService.chatWithTemplate(topic, context);
}
```

---

## 📊 性能优化建议

### 1. 缓存响应

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class AiService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async chatWithCache(message: string): Promise<string> {
    const cacheKey = `chat:${message}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    
    if (cached) return cached;
    
    const response = await this.chat(message);
    await this.cacheManager.set(cacheKey, response, 3600000); // 1小时
    
    return response;
  }
}
```

### 2. 并行处理

```typescript
async batchProcess(messages: string[]): Promise<string[]> {
  return await Promise.all(
    messages.map(message => this.chat(message))
  );
}
```

### 3. 流量控制

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('ai')
export class AiController {
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('chat')
  async chat(@Body() chatDto: ChatDto) {
    // 限制每分钟最多10次请求
  }
}
```

---

## 🔒 安全建议

1. **API Key 安全**
   - 不要在代码中硬编码 API Key
   - 使用环境变量
   - 定期轮换 API Key

2. **输入验证**
   - 使用 DTO 验证所有输入
   - 限制输入长度
   - 过滤敏感信息

3. **速率限制**
   - 实现请求频率限制
   - 设置用户配额
   - 监控异常使用

4. **错误处理**
   - 不要暴露详细错误信息
   - 记录所有 API 调用
   - 实现优雅降级

---

## 📚 更多资源

- [LangChain.js 官方文档](https://js.langchain.com/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [NestJS 文档](https://docs.nestjs.com/)

---

**🎉 现在您可以在项目中使用强大的 AI 功能了！**

