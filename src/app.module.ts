import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CatsModule } from './cats/cats.module';
import { validateEnv } from './env.validation';
import { loggerSplitConfig } from './common/config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRoot(loggerSplitConfig),
    CatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
