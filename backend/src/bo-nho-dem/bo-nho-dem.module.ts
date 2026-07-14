import { Global, Module } from '@nestjs/common';
import { BoNhoDemXuLy } from './bo-nho-dem.xu-ly';

@Global()
@Module({
  providers: [BoNhoDemXuLy],
  exports: [BoNhoDemXuLy],
})
export class BoNhoDemModule {}

