import { PartialType } from '@nestjs/mapped-types';
import { CreateCatDto } from './create-cat.dto';

/**
 * 更新猫的 DTO - 使用 class-validator 进行验证
 * 所有字段都是可选的（partial）
 */
export class UpdateCatDto extends PartialType(CreateCatDto) {}
