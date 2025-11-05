import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Cat } from './entities/cat.entity';
import { BusinessException, BusinessExceptions } from '../common';

@Injectable()
export class CatsService {
  private cats: Cat[] = [];
  private idCounter = 1;

  constructor(private readonly logger: Logger) {}

  /**
   * 获取所有猫
   */
  findAll(): Cat[] {
    this.logger.log('Finding all cats');
    return this.cats.map((cat) => new Cat(cat));
  }

  /**
   * 根据 ID 获取猫
   */
  findOne(id: number): Cat {
    this.logger.log({ id }, 'Finding cat by ID');
    const cat = this.cats.find((c) => c.id === id);
    if (!cat) {
      this.logger.warn({ id }, 'Cat not found');
      throw BusinessExceptions.notFound(`Cat with ID ${id} not found`);
    }
    return new Cat(cat);
  }

  /**
   * 创建新猫
   */
  create(createCatDto: CreateCatDto): Cat {
    this.logger.log({ createCatDto }, 'Creating new cat');

    // 业务校验示例：检查名字是否已存在
    const existingCat = this.cats.find((c) => c.name === createCatDto.name);
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

    const cat = new Cat({
      id: this.idCounter++,
      ...createCatDto,
      internalNotes: 'This is internal data',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.cats.push(cat);

    this.logger.log({ catId: cat.id, name: cat.name }, 'Cat created');
    return cat;
  }

  /**
   * 更新猫信息
   */
  update(id: number, updateCatDto: UpdateCatDto): Cat {
    const catIndex = this.cats.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      throw new NotFoundException({
        code: 'CAT_NOT_FOUND',
        message: `Cat with ID ${id} not found`,
      });
    }

    this.cats[catIndex] = {
      ...this.cats[catIndex],
      ...updateCatDto,
      updatedAt: new Date(),
    };

    return new Cat(this.cats[catIndex]);
  }

  /**
   * 删除猫
   */
  remove(id: number): void {
    this.logger.log({ id }, 'Deleting cat');
    const catIndex = this.cats.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      this.logger.warn({ id }, 'Cat not found for deletion');
      throw new NotFoundException({
        code: 'CAT_NOT_FOUND',
        message: `Cat with ID ${id} not found`,
      });
    }
    this.cats.splice(catIndex, 1);
    this.logger.log({ id }, 'Cat deleted');
  }
}
