# Server-Sent Events (SSE) 使用指南

## 📋 什么是 SSE？

Server-Sent Events (SSE) 是一种服务器向客户端推送数据的技术，适合实时流式数据传输（如 AI 流式响应）。

---

## 🚀 调用方式

### 方法 1：使用 EventSource（浏览器/前端）

#### JavaScript/TypeScript

```javascript
// 创建 EventSource 连接
const eventSource = new EventSource('http://localhost:8866/ai/chat/stream');

// 监听消息
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到数据:', data.content);
  
  // 显示在页面上
  document.getElementById('output').innerHTML += data.content;
};

// 监听错误
eventSource.onerror = (error) => {
  console.error('连接错误:', error);
  eventSource.close();
};

// 完成后关闭连接
// eventSource.close();
```

#### React 示例

```tsx
import { useEffect, useState } from 'react';

function ChatStream() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = () => {
    setIsStreaming(true);
    setMessages([]);

    const eventSource = new EventSource('http://localhost:8866/ai/chat/stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data.content]);
    };

    eventSource.onerror = () => {
      console.log('Stream completed or error occurred');
      eventSource.close();
      setIsStreaming(false);
    };

    // 清理函数
    return () => {
      eventSource.close();
    };
  };

  return (
    <div>
      <button onClick={startStream} disabled={isStreaming}>
        开始流式对话
      </button>
      <div>
        {messages.map((msg, i) => (
          <span key={i}>{msg}</span>
        ))}
      </div>
    </div>
  );
}
```

#### Vue 示例

```vue
<template>
  <div>
    <button @click="startStream" :disabled="isStreaming">
      开始流式对话
    </button>
    <div class="output">
      <span v-for="(msg, i) in messages" :key="i">{{ msg }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const messages = ref([]);
const isStreaming = ref(false);
let eventSource = null;

const startStream = () => {
  isStreaming.value = true;
  messages.value = [];

  eventSource = new EventSource('http://localhost:8866/ai/chat/stream');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    messages.value.push(data.content);
  };

  eventSource.onerror = () => {
    eventSource.close();
    isStreaming.value = false;
  };
};

// 组件卸载时关闭连接
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
</script>
```

---

### 方法 2：使用 fetch API（更灵活）

```javascript
async function streamChat(message) {
  const response = await fetch('http://localhost:8866/ai/chat/stream', {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
    },
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        console.log('收到:', data.content);
        
        // 处理数据...
        document.getElementById('output').innerHTML += data.content;
      }
    }
  }
}

// 使用
streamChat('讲一个故事');
```

---

### 方法 3：使用 cURL（测试）

```bash
# 基本测试
curl -N http://localhost:8866/ai/chat/stream

# 看到流式输出
# data: {"content":"Once"}
# data: {"content":" upon"}
# data: {"content":" a"}
# data: {"content":" time"}
# ...
```

---

## 🔧 修复当前实现

### 问题

您当前的 SSE 端点需要 POST body，但 EventSource 只支持 GET 请求。

### 解决方案 1：改为 GET 请求

修改控制器，使用查询参数：

```typescript
@Controller('ai')
export class AiController {
  /**
   * 流式聊天（Server-Sent Events）
   * GET /ai/chat/stream?message=你好
   */
  @Sse('chat/stream')
  chatStream(@Query('message') message: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const chunk of this.aiService.chatStream(message)) {
            subscriber.next({
              data: { content: chunk },
            } as MessageEvent);
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
```

客户端调用：

```javascript
const eventSource = new EventSource(
  'http://localhost:8866/ai/chat/stream?message=' + encodeURIComponent('你好')
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};
```

### 解决方案 2：创建两个接口

保留 POST 接口用于初始化，返回一个会话 ID，然后用 GET 接口接收流：

```typescript
@Controller('ai')
export class AiController {
  private sessions = new Map<string, string>();

  /**
   * 创建流式聊天会话
   * POST /ai/chat/stream/init
   */
  @Post('chat/stream/init')
  initChatStream(@Body() chatDto: ChatDto): { sessionId: string } {
    const sessionId = Math.random().toString(36).substring(7);
    this.sessions.set(sessionId, chatDto.message);
    
    // 5分钟后清理
    setTimeout(() => this.sessions.delete(sessionId), 5 * 60 * 1000);
    
    return { sessionId };
  }

  /**
   * 获取流式聊天数据
   * GET /ai/chat/stream/:sessionId
   */
  @Sse('chat/stream/:sessionId')
  chatStream(@Param('sessionId') sessionId: string): Observable<MessageEvent> {
    const message = this.sessions.get(sessionId);
    
    if (!message) {
      throw new NotFoundException('Session not found');
    }

    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const chunk of this.aiService.chatStream(message)) {
            subscriber.next({
              data: { content: chunk },
            } as MessageEvent);
          }
          subscriber.complete();
          this.sessions.delete(sessionId);
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
```

客户端调用：

```javascript
// 1. 初始化会话
const response = await fetch('http://localhost:8866/ai/chat/stream/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '讲一个故事' }),
});

const { sessionId } = await response.json();

// 2. 连接 SSE
const eventSource = new EventSource(
  `http://localhost:8866/ai/chat/stream/${sessionId}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};

eventSource.onerror = () => {
  eventSource.close();
};
```

---

## 💡 完整示例

### HTML + JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI 流式聊天</title>
  <style>
    #output {
      white-space: pre-wrap;
      padding: 20px;
      border: 1px solid #ccc;
      min-height: 200px;
      margin: 20px 0;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <h1>AI 流式聊天</h1>
  
  <input 
    type="text" 
    id="message" 
    placeholder="输入消息..." 
    style="width: 300px; padding: 10px;"
  />
  <button onclick="startStream()">发送</button>
  <button onclick="stopStream()">停止</button>

  <div id="output"></div>

  <script>
    let eventSource = null;

    function startStream() {
      const message = document.getElementById('message').value;
      if (!message) {
        alert('请输入消息');
        return;
      }

      // 清空输出
      document.getElementById('output').innerHTML = '';

      // 创建 EventSource
      const url = 'http://localhost:8866/ai/chat/stream?message=' + 
                  encodeURIComponent(message);
      
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        document.getElementById('output').innerHTML += data.content;
      };

      eventSource.onerror = (error) => {
        console.error('Stream error:', error);
        stopStream();
      };

      eventSource.addEventListener('close', () => {
        console.log('Stream closed by server');
        stopStream();
      });
    }

    function stopStream() {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('Stream stopped');
      }
    }
  </script>
</body>
</html>
```

---

## 🎯 推荐方案

### 最简单：使用 GET 请求

```typescript
// Controller
@Sse('chat/stream')
chatStream(@Query('message') message: string): Observable<MessageEvent> {
  // ... 实现
}
```

```javascript
// Client
const eventSource = new EventSource(
  'http://localhost:8866/ai/chat/stream?message=你好'
);
```

### 最灵活：POST + GET 分离

适合需要发送复杂数据或大量参数的场景。

---

## ⚠️ 注意事项

1. **CORS 配置**
   ```typescript
   // main.ts
   app.enableCors({
     origin: 'http://localhost:3000',
     credentials: true,
   });
   ```

2. **连接超时**
   - EventSource 会自动重连
   - 可以设置最大重连次数

3. **内存管理**
   - 及时关闭不用的连接
   - 清理服务端的会话数据

4. **错误处理**
   - 监听 `onerror` 事件
   - 实现重连逻辑

---

## 📚 参考资源

- [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [NestJS SSE 文档](https://docs.nestjs.com/techniques/server-sent-events)

**✨ 现在您知道如何正确调用 SSE 接口了！**

