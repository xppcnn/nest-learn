import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

/**
 * AI 模块 - LangChain 集成模块
 */
@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService], // 导出服务供其他模块使用
})
export class AiModule {}
