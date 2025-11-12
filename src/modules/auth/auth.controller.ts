import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterEntity } from './entities/register.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterEntity> {
    return await this.authService.register(registerDto);
  }

  @Get('/email-captcha')
  getEmailCaptcha(@Query('email') email: string) {
    return this.authService.getEmailCaptcha(email);
  }
}
