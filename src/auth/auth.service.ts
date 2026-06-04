import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';

// Cost factor for bcrypt password hashing.
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    // This is a single-admin portfolio: registration is a one-time bootstrap.
    // Once an account exists the endpoint is permanently closed, so a leaked
    // ADMIN_PWD can't be used to mint extra admin accounts.
    const existingUsers = await this.prisma.user.count();
    if (existingUsers > 0) {
      throw new ForbiddenException(
        'Registration is closed: an account already exists',
      );
    }

    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
      },
    });

    return this.signToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email);
  }

  async signToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      access_token: this.jwt.sign(payload),
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  }
}
