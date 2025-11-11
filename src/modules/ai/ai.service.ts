import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Logger } from 'nestjs-pino';

/**
 * AI 服务 - 使用 LangChain.js 集成 AI 功能（通过 OpenRouter）
 */
@Injectable()
export class AiService {
  private chatModel: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    // 初始化 ChatOpenAI 模型，使用 OpenRouter 作为提供商
    this.chatModel = new ChatOpenAI({
      modelName:
        this.configService.get<string>('OPENROUTER_MODEL') ||
        'anthropic/claude-3.5-sonnet',
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      temperature: 0.7,
      maxTokens: 4000,
      configuration: {
        baseURL:
          this.configService.get<string>('AI_BASE_URL') ||
          'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer':
            this.configService.get<string>('OPENROUTER_REFERER') ||
            'http://localhost:8866',
          'X-Title':
            this.configService.get<string>('OPENROUTER_APP_NAME') ||
            'NestJS App',
        },
      },
    });

    this.logger.log(
      {
        provider: 'OpenRouter',
        model:
          this.configService.get<string>('OPENROUTER_MODEL') ||
          'anthropic/claude-3.5-sonnet',
      },
      'AI Service initialized with LangChain',
    );
  }

  /**
   * 简单聊天 - 直接调用模型
   */
  async chat(message: string): Promise<string> {
    try {
      this.logger.log({ message }, 'Processing chat message');

      const response = await this.chatModel.invoke(message);

      return response.content as string;
    } catch (error) {
      this.logger.error({ error }, 'Chat failed');
      throw error;
    }
  }

  /**
   * 使用 Prompt Template 的聊天
   */
  async chatWithTemplate(topic: string, context?: string): Promise<string> {
    try {
      this.logger.log({ topic, context }, 'Processing templated chat');

      const promptTemplate = PromptTemplate.fromTemplate(
        `You are a helpful assistant. 
        {context}
        
        User's question: {topic}
        
        Please provide a detailed and helpful response.`,
      );

      const chain = promptTemplate
        .pipe(this.chatModel)
        .pipe(new StringOutputParser());

      const response = await chain.invoke({
        topic,
        context: context || 'No additional context provided.',
      });

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Templated chat failed');
      throw error;
    }
  }

  /**
   * 总结文本
   */
  async summarize(text: string): Promise<string> {
    try {
      this.logger.log('Summarizing text');

      const promptTemplate = PromptTemplate.fromTemplate(
        `Please summarize the following text concisely:
        
        {text}
        
        Summary:`,
      );

      const chain = promptTemplate
        .pipe(this.chatModel)
        .pipe(new StringOutputParser());

      const summary = await chain.invoke({ text });

      return summary;
    } catch (error) {
      this.logger.error({ error }, 'Summarization failed');
      throw error;
    }
  }

  /**
   * 翻译文本
   */
  async translate(
    text: string,
    targetLanguage: string = 'Chinese',
  ): Promise<string> {
    try {
      this.logger.log({ targetLanguage }, 'Translating text');

      const promptTemplate = PromptTemplate.fromTemplate(
        `Translate the following text to {targetLanguage}:
        
        {text}
        
        Translation:`,
      );

      const chain = promptTemplate
        .pipe(this.chatModel)
        .pipe(new StringOutputParser());

      const translation = await chain.invoke({
        text,
        targetLanguage,
      });

      return translation;
    } catch (error) {
      this.logger.error({ error }, 'Translation failed');
      throw error;
    }
  }

  /**
   * 代码解释
   */
  async explainCode(
    code: string,
    language: string = 'TypeScript',
  ): Promise<string> {
    try {
      this.logger.log({ language }, 'Explaining code');

      const promptTemplate = PromptTemplate.fromTemplate(
        `You are an expert programmer. Please explain the following {language} code:
        
        \`\`\`{language}
        {code}
        \`\`\`
        
        Please provide:
        1. What this code does
        2. Key concepts used
        3. Any potential improvements
        
        Explanation:`,
      );

      const chain = promptTemplate
        .pipe(this.chatModel)
        .pipe(new StringOutputParser());

      const explanation = await chain.invoke({
        code,
        language,
      });

      return explanation;
    } catch (error) {
      this.logger.error({ error }, 'Code explanation failed');
      throw error;
    }
  }

  /**
   * 流式聊天（返回 AsyncIterable）
   */
  async *chatStream(message: string): AsyncIterable<string> {
    try {
      this.logger.log({ message }, 'Starting stream chat');

      const stream = await this.chatModel.stream(message);

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    } catch (error) {
      this.logger.error({ error }, 'Stream chat failed');
      throw error;
    }
  }
}
