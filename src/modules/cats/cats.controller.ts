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
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Cat } from './entities/cat.entity';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Roles } from '@/common';

/**
 * 猫控制器 - 演示 ValidationPipe、HttpExceptionFilter 和 ClassSerializerInterceptor
 */
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  /**
   * 获取所有猫
   * 演示：ClassSerializerInterceptor 自动排除 @Exclude 标记的字段
   */
  @Roles('user', 'super-admin')
  @Get()
  async findAll(@Query() pagination: PaginationDto): Promise<Cat[]> {
    console.log('Pagination:', pagination);
    return this.catsService.findAll();
  }

  /**
   * 根据 ID 获取猫
   * 演示：ClassSerializerInterceptor 自动排除 @Exclude 标记的字段
   */
  @Roles('user', 'super-admin')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Cat> {
    return this.catsService.findOne(id);
  }

  /**
   * 创建新猫
   * 演示：ValidationPipe 自动验证 DTO，ClassSerializerInterceptor 隐藏 internalNotes
   */
  @Roles('super-admin')
  @Post()
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  /**
   * 更新猫信息
   * 演示：组合使用 ParseIntPipe 和 ValidationPipe
   */
  @Roles('super-admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatDto: UpdateCatDto,
  ): Promise<Cat> {
    return this.catsService.update(id, updateCatDto);
  }

  /**
   * 删除猫
   * 演示：删除操作和异常处理
   */
  @Roles('super-admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.catsService.remove(id);
    return { message: `Cat with ID ${id} has been removed` };
  }
}
