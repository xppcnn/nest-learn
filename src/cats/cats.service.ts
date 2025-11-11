import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Cat } from './entities/cat.entity';
import { BusinessException, BusinessExceptions } from '../common';
import { PrismaService } from 'nestjs-prisma';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class CatsService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * 获取所有猫
   */
  async findAll(): Promise<Cat[]> {
    this.logger.log('Finding all cats');
    await this.redis.set('cats', JSON.stringify({ name: 'test' }));
    const cats = await this.prisma.cat.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return cats.map((cat) => new Cat(cat));
  }

  /**
   * 根据 ID 获取猫
   */
  async findOne(id: number): Promise<Cat> {
    this.logger.log({ id }, 'Finding cat by ID');
    const cat = await this.prisma.cat.findUnique({
      where: { id },
    });
    if (!cat) {
      this.logger.warn({ id }, 'Cat not found');
      throw BusinessExceptions.notFound(`Cat with ID ${id} not found`);
    }
    return new Cat(cat);
  }

  /**
   * 创建新猫
   */
  async create(createCatDto: CreateCatDto): Promise<Cat> {
    this.logger.log({ createCatDto }, 'Creating new cat');

    // 业务校验示例：检查名字是否已存在
    const existingCat = await this.prisma.cat.findFirst({
      where: { name: createCatDto.name },
    });
    if (existingCat) {
      this.logger.warn({ name: createCatDto.name }, 'Cat name already exists');
      // 抛出业务异常：HTTP 200，但 code 为 400
      throw BusinessExceptions.badRequest('猫的名字已存在', {
        existingName: existingCat.name,
      });
    }

    // 业务校验示例：检查年龄是否合理
    if (createCatDto.age && createCatDto.age > 30) {
      this.logger.warn({ age: createCatDto.age }, 'Invalid cat age');
      // 使用自定义业务错误码
      throw new BusinessException(1001, '猫的年龄不能超过30岁', {
        maxAge: 30,
        providedAge: createCatDto.age,
      });
    }

    const cat = await this.prisma.cat.create({
      data: {
        ...createCatDto,
        internalNotes:
          'This is internal data - should not be exposed to clients',
      },
    });

    this.logger.log({ catId: cat.id, name: cat.name }, 'Cat created');
    return new Cat(cat);
  }

  /**
   * 更新猫信息
   */
  async update(id: number, updateCatDto: UpdateCatDto): Promise<Cat> {
    const existingCat = await this.prisma.cat.findUnique({
      where: { id },
    });

    if (!existingCat) {
      throw new NotFoundException({
        code: 'CAT_NOT_FOUND',
        message: `Cat with ID ${id} not found`,
      });
    }

    const updatedCat = await this.prisma.cat.update({
      where: { id },
      data: updateCatDto,
    });

    return new Cat(updatedCat);
  }

  /**
   * 删除猫
   */
  async remove(id: number): Promise<void> {
    this.logger.log({ id }, 'Deleting cat');
    const existingCat = await this.prisma.cat.findUnique({
      where: { id },
    });

    if (!existingCat) {
      this.logger.warn({ id }, 'Cat not found for deletion');
      throw new NotFoundException({
        code: 'CAT_NOT_FOUND',
        message: `Cat with ID ${id} not found`,
      });
    }

    await this.prisma.cat.delete({
      where: { id },
    });

    this.logger.log({ id }, 'Cat deleted');
  }
}
