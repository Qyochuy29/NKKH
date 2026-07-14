import { Module } from '@nestjs/common';
import { ThongKeDieuKhien } from './thong-ke.dieu-khien';
import { ThongKeXuLy } from './thong-ke.xu-ly';

@Module({
  controllers: [ThongKeDieuKhien],
  providers: [ThongKeXuLy],
})
export class ThongKeModule {}

