import { Params } from 'nestjs-pino';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// 创建日志目录结构
const logsDir = join(process.cwd(), 'logs');
const errorLogsDir = join(logsDir, 'error');
const infoLogsDir = join(logsDir, 'info');

// 确保目录存在
[logsDir, errorLogsDir, infoLogsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 获取当前日期的日志文件名
 */
function getLogFileName(level: 'error' | 'info'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const dir = level === 'error' ? errorLogsDir : infoLogsDir;
  return path.join(dir, `${dateStr}.log`);
}

/**
 * 自定义日志流
 * 根据日志级别将日志写入不同的文件
 */
class SplitLogStream {
  private errorStream: fs.WriteStream | null = null;
  private infoStream: fs.WriteStream | null = null;
  private currentErrorFile = '';
  private currentInfoFile = '';

  write(chunk: string) {
    try {
      const log = JSON.parse(chunk);
      const level = log.level;

      // level >= 50 为 error 级别（error: 50, fatal: 60）
      if (level >= 50) {
        this.writeToErrorLog(chunk);
      } else {
        // 其他级别（info: 30, warn: 40 等）
        this.writeToInfoLog(chunk);
      }
    } catch (error: unknown) {

      // 如果解析失败，写入到 info 日志
      this.writeToInfoLog(chunk);
    }
  }

  private writeToErrorLog(chunk: string) {
    const fileName = getLogFileName('error');

    // 如果日期变了，关闭旧文件，创建新文件
    if (fileName !== this.currentErrorFile) {
      if (this.errorStream) {
        this.errorStream.end();
      }
      this.errorStream = fs.createWriteStream(fileName, { flags: 'a' });
      this.currentErrorFile = fileName;
    }

    if (this.errorStream) {
      this.errorStream.write(chunk);
    }
  }

  private writeToInfoLog(chunk: string) {
    const fileName = getLogFileName('info');

    // 如果日期变了，关闭旧文件，创建新文件
    if (fileName !== this.currentInfoFile) {
      if (this.infoStream) {
        this.infoStream.end();
      }
      this.infoStream = fs.createWriteStream(fileName, { flags: 'a' });
      this.currentInfoFile = fileName;
    }

    if (this.infoStream) {
      this.infoStream.write(chunk);
    }
  }
}

/**
 * 按日志级别和日期分割的配置
 *
 * 目录结构：
 * logs/
 * ├── error/
 * │   ├── 2025-11-05.log
 * │   ├── 2025-11-06.log
 * │   └── 2025-11-07.log
 * └── info/
 *     ├── 2025-11-05.log
 *     ├── 2025-11-06.log
 *     └── 2025-11-07.log
 */
export const loggerSplitConfig: Params = {
  pinoHttp: {
    // 自定义日志格式
    customProps: () => ({
      context: 'HTTP',
      environment: process.env.NODE_ENV || 'development',
    }),
    // 开发环境使用 pino-pretty
    ...(process.env.NODE_ENV !== 'production'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              levelFirst: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
              messageFormat: '{context} [{req.method}] {req.url} - {msg}',
            },
          },
        }
      : {
          // 生产环境使用自定义流
          stream: new SplitLogStream(),
        }),
    // 自定义日志级别
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    // 自定义成功日志消息
    customSuccessMessage: (req, res) => {
      if (res.statusCode === 404) {
        return 'Resource not found';
      }
      return `${req.method} ${req.url} completed`;
    },
    // 自定义错误日志消息
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} failed: ${err.message}`;
    },
    // 自定义请求属性记录
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },
    // 序列化器配置
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      }),
    },
    // 日志级别
    level: process.env.LOG_LEVEL || 'info',
    // 自动记录请求和响应
    autoLogging: true,
    // 自定义请求 ID 生成器
    genReqId: (req: any) => {
      const requestId = req.headers?.['x-request-id'] || req.id;
      return requestId as string;
    },
  },
};
