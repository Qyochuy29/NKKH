import { Module } from '@nestjs/common';
import { KhuVucDieuKhien } from './khu-vuc.dieu-khien';
import { KhuVucXuLy } from './khu-vuc.xu-ly';

@Module({
  controllers: [KhuVucDieuKhien],
  providers: [KhuVucXuLy],
  exports: [KhuVucXuLy],
})
export class KhuVucModule {}
