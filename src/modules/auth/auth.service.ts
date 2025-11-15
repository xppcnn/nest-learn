import { Injectable } from '@nestjs/common';
import { EmailService } from '@/modules/email/email.service';
import { PrismaService } from 'nestjs-prisma';
import { RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';
import { BusinessException } from '@/common';
import { RegisterEntity } from './entities/register.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

const DEFAULT_ROLE_CODE = 'user';

@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    await this.assignDefaultRole(newUser.id);
    return new RegisterEntity(newUser);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BusinessException(1003, '用户名或密码错误');
    }

    // TODO: 使用 bcrypt 等库来安全地比较密码
    if (user.password !== dto.password) {
      throw new BusinessException(1003, '用户名或密码错误');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '1d'),
    });

    return { accessToken };
  }

  async getEmailCaptcha(email: string): Promise<void> {
    const captcha = Math.random().toString(36).substring(2, 15);
    await this.emailService.sendEmail(
      email,
      'Email Captcha',
      'Your email captcha is: ' + captcha,
    );
  }

  private async assignDefaultRole(userId: number): Promise<void> {
    const defaultRole = await this.prisma.role.findUnique({
      where: {
        code: DEFAULT_ROLE_CODE,
      },
    });

    if (!defaultRole) {
      throw new BusinessException(1002, '系统未配置默认角色');
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: defaultRole.id,
      },
    });
  }
}
