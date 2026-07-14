import { Module } from '@nestjs/common';
import { AiGiaLapXuLy } from './ai-gia-lap.xu-ly';
import { CanhBaoModule } from '../canh-bao/canh-bao.module';
import { ThietBiModule } from '../thiet-bi/thiet-bi.module';

@Module({
  imports: [CanhBaoModule, ThietBiModule],
  providers: [AiGiaLapXuLy],
})
export class AiGiaLapModule {}

