import {
  Body,
  Controller,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Constant-time comparison of the supplied registration key against
   * ADMIN_PWD, to avoid leaking the key length/content through timing.
   */
  private isValidAdminKey(provided: string | undefined): boolean {
    const expected = this.configService.get<string>('auth.admin_pwd') ?? '';
    const a = Buffer.from(provided ?? '');
    const b = Buffer.from(expected);
    // timingSafeEqual requires equal lengths; a length mismatch is an
    // immediate (and unavoidable) reject.
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  @Public()
  @Post('/register')
  create(@Body() registerDto: RegisterDto, @Query('key') key: string) {
    if (!this.isValidAdminKey(key)) {
      throw new UnauthorizedException();
    }

    return this.authService.register(registerDto);
  }

  @Public()
  @Post('/login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
