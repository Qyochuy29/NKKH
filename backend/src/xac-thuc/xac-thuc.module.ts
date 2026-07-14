import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { XacThucDieuKhien } from './xac-thuc.dieu-khien';
import { XacThucXuLy } from './xac-thuc.xu-ly';
import { ChienLuocJwt } from './jwt.chien-luoc';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'school-guardian-jwt-secret-key-2024',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [XacThucDieuKhien],
  providers: [XacThucXuLy, ChienLuocJwt],
  exports: [XacThucXuLy, JwtModule],
})
export class XacThucModule {}

