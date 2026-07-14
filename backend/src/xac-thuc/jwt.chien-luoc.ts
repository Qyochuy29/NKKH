import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class ChienLuocJwt extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'school-guardian-jwt-secret-key-2024',
    });
  }

  async validate(payload: any) {
    return { sub: payload.sub, email: payload.email, role: payload.role, name: payload.name };
  }
}

