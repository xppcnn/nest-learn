import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service';
import { ConfigService } from '@nestjs/config';

@Controller('cats')
export class CatsController {
  constructor(
    private readonly catsService: CatsService,
    private readonly configService: ConfigService,
  ) {}
  @Get()
  getCats(): string {
    console.log(this.configService.get('DATABASE_USER'));
    return this.catsService.getCats();
  }
}
