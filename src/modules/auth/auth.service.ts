import { Injectable } from '@nestjs/common';
import { EmailService } from '@/modules/email/email.service';
import { PrismaService } from 'nestjs-prisma';
import { RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';
import { BusinessException } from '@/common';
import { RegisterEntity } from './entities/register.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterEntity> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new BusinessException(1001, '用户已存在');
    }
    const { captcha, ...userData } = registerDto;
    void captcha; // 标记为已使用

    const newUser = await this.prisma.user.create({
      data: userData as Prisma.UserCreateInput,
    });
    return new RegisterEntity(newUser);
  }

  async getEmailCaptcha(email: string): Promise<void> {
    const captcha = Math.random().toString(36).substring(2, 15);
    await this.emailService.sendEmail(
      email,
      'Email Captcha',
      'Your email captcha is: ' + captcha,
    );
  }
}
