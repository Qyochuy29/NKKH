import { Module } from '@nestjs/common';
import { ThietBiDieuKhien } from './thiet-bi.dieu-khien';
import { ThietBiXuLy } from './thiet-bi.xu-ly';

@Module({
  controllers: [ThietBiDieuKhien],
  providers: [ThietBiXuLy],
  exports: [ThietBiXuLy],
})
export class ThietBiModule {}

