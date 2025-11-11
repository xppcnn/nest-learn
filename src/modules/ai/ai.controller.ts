import { Controller, Post, Body, Sse, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { SummarizeDto } from './dto/summarize.dto';
import { TranslateDto } from './dto/translate.dto';
import { CodeExplainDto } from './dto/code-explain.dto';
import { Observable } from 'rxjs';

/**
 * AI 控制器 - 提供 LangChain 功能的 API 接口
 */
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 简单聊天
   * POST /ai/chat
   */
  @Post('chat')
  async chat(@Body() chatDto: ChatDto): Promise<{ response: string }> {
    const response = await this.aiService.chat(chatDto.message);
    return { response };
  }

  /**
   * 使用模板的聊天
   * POST /ai/chat/template
   */
  @Post('chat/template')
  async chatWithTemplate(
    @Body() chatDto: ChatDto,
  ): Promise<{ response: string }> {
    const response = await this.aiService.chatWithTemplate(
      chatDto.message,
      chatDto.context,
    );
    return { response };
  }

  /**
   * 总结文本
   * POST /ai/summarize
   */
  @Post('summarize')
  async summarize(
    @Body() summarizeDto: SummarizeDto,
  ): Promise<{ summary: string }> {
    const summary = await this.aiService.summarize(summarizeDto.text);
    return { summary };
  }

  /**
   * 翻译文本
   * POST /ai/translate
   */
  @Post('translate')
  async translate(
    @Body() translateDto: TranslateDto,
  ): Promise<{ translation: string }> {
    const translation = await this.aiService.translate(
      translateDto.text,
      translateDto.targetLanguage,
    );
    return { translation };
  }

  /**
   * 解释代码
   * POST /ai/explain-code
   */
  @Post('explain-code')
  async explainCode(
    @Body() codeExplainDto: CodeExplainDto,
  ): Promise<{ explanation: string }> {
    const explanation = await this.aiService.explainCode(
      codeExplainDto.code,
      codeExplainDto.language,
    );
    return { explanation };
  }

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
