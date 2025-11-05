import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Cat } from './entities/cat.entity';

@Injectable()
export class CatsService {
  private cats: Cat[] = [];
  private idCounter = 1;

  /**
   * 获取所有猫
   */
  findAll(): Cat[] {
    return this.cats.map((cat) => new Cat(cat));
  }

  /**
   * 根据 ID 获取猫
   */
  findOne(id: number): Cat {
    const cat = this.cats.find((c) => c.id === id);
    if (!cat) {
      throw new NotFoundException({
        code: 'CAT_NOT_FOUND',
        message: `Cat with ID ${id} not found`,
      });
    }
    return new Cat(cat);
  }

  /**
   * 创建新猫
   */
  create(createCatDto: CreateCatDto): Cat {
    const cat = new Cat({
      id: this.idCounter++,
      ...createCatDto,
      internalNotes: 'This is internal data',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.cats.push(cat);
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
    const catIndex = this.cats.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      throw new NotFoundException({
        code: 'CAT_NOT_FOUND',
        message: `Cat with ID ${id} not found`,
      });
    }
    this.cats.splice(catIndex, 1);
  }
}
