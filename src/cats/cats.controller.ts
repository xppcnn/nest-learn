import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CatsService } from './cats.service';
import type { CreateCatDto } from './dto/create-cat.dto';
import { createCatSchema } from './dto/create-cat.dto';
import type { UpdateCatDto } from './dto/update-cat.dto';
import { updateCatSchema } from './dto/update-cat.dto';
import { Cat } from './entities/cat.entity';
import type { PaginationDto } from '../common';
import { paginationSchema } from '../common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

/**
 * 猫控制器 - 演示全局 ValidationPipe、HttpExceptionFilter 和 ClassSerializerInterceptor
 */
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  /**
   * 获取所有猫
   * 演示：响应转换拦截器和分页 DTO 验证
   */
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(paginationSchema)) pagination: PaginationDto,
  ): Promise<Cat[]> {
    console.log('Pagination:', pagination);
    return this.catsService.findAll();
  }

  /**
   * 根据 ID 获取猫
   * 演示：ParseIntPipe 和 HttpExceptionFilter（当猫不存在时）
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Cat> {
    return this.catsService.findOne(id);
  }

  /**
   * 创建新猫
   * 演示：Zod 验证 DTO，ClassSerializerInterceptor 隐藏 internalNotes
   */
  @Post()
  async create(
    @Body(new ZodValidationPipe(createCatSchema)) createCatDto: CreateCatDto,
  ): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  /**
   * 更新猫信息
   * 演示：组合使用 ParseIntPipe 和 Zod ValidationPipe
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateCatSchema)) updateCatDto: UpdateCatDto,
  ): Promise<Cat> {
    return this.catsService.update(id, updateCatDto);
  }

  /**
   * 删除猫
   * 演示：删除操作和异常处理
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.catsService.remove(id);
    return { message: `Cat with ID ${id} has been removed` };
  }
}
