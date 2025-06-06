import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    console.log('AUTH =', config.get<string>('auth'));
    console.log('JWT SECRET =', config.get<string>('auth.jwt_secret'));

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('auth.jwt_secret')!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Ce que tu veux retrouver dans req.user
    return payload;
  }
}
