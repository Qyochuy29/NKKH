import { Module } from '@nestjs/common';
import { NguoiDungDieuKhien } from './nguoi-dung.dieu-khien';
import { NguoiDungXuLy } from './nguoi-dung.xu-ly';

@Module({
  controllers: [NguoiDungDieuKhien],
  providers: [NguoiDungXuLy],
  exports: [NguoiDungXuLy],
})
export class NguoiDungModule {}

