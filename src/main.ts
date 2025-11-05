import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { HttpStatusInterceptor } from './common/interceptors/http-status.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 自动剥离未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 如果有未定义的属性则抛出错误
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

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
}

void bootstrap();
