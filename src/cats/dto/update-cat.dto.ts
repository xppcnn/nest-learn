import { PartialType } from '@nestjs/mapped-types';
import { CreateCatDto } from './create-cat.dto';

/**
 * 更新猫的 DTO - 继承 CreateCatDto 并使所有字段可选
 */
export class UpdateCatDto extends PartialType(CreateCatDto) {}
