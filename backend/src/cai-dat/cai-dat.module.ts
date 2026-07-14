import { Module } from '@nestjs/common';
import { CaiDatDieuKhien } from './cai-dat.dieu-khien';
import { CaiDatXuLy } from './cai-dat.xu-ly';

@Module({
  controllers: [CaiDatDieuKhien],
  providers: [CaiDatXuLy],
  exports: [CaiDatXuLy],
})
export class CaiDatModule {}

