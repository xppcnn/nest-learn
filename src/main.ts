import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { HttpStatusInterceptor } from './common/interceptors/http-status.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  // 注意：现在使用 Zod 验证，通过在各个路由处理器上使用 ZodValidationPipe
  // 不再需要全局 ValidationPipe

  // 全局异常过滤器（注入 Logger）
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // 全局序列化拦截器
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 全局 HTTP 状态码拦截器（将 POST 的 201 改为 200）
  app.useGlobalInterceptors(new HttpStatusInterceptor());

  // 全局响应转换拦截器（可选）
  app.useGlobalInterceptors(new TransformInterceptor());

  // 启用 CORS（开发环境）
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors();
  }

  const port = configService.get<number>('PORT') ?? 8866;
  await app.listen(port);
  logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}

void bootstrap();
