import { Global, Module } from '@nestjs/common';
import { CoSoDuLieuXuLy } from './co-so-du-lieu.xu-ly';

@Global()
@Module({
  providers: [CoSoDuLieuXuLy],
  exports: [CoSoDuLieuXuLy],
})
export class CoSoDuLieuModule {}

