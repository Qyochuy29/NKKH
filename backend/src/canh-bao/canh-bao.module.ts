import { Module } from '@nestjs/common';
import { CanhBaoDieuKhien } from './canh-bao.dieu-khien';
import { CanhBaoXuLy } from './canh-bao.xu-ly';
import { CanhBaoCongKetNoi } from './canh-bao.cong-ket-noi';

@Module({
  controllers: [CanhBaoDieuKhien],
  providers: [CanhBaoXuLy, CanhBaoCongKetNoi],
  exports: [CanhBaoXuLy],
})
export class CanhBaoModule { }

