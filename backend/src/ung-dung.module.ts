import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { CoSoDuLieuModule } from './co-so-du-lieu/co-so-du-lieu.module';
import { BoNhoDemModule } from './bo-nho-dem/bo-nho-dem.module';
import { XacThucModule } from './xac-thuc/xac-thuc.module';
import { NguoiDungModule } from './nguoi-dung/nguoi-dung.module';
import { ThietBiModule } from './thiet-bi/thiet-bi.module';
import { CanhBaoModule } from './canh-bao/canh-bao.module';
import { ThongKeModule } from './thong-ke/thong-ke.module';
import { CaiDatModule } from './cai-dat/cai-dat.module';
import { AiGiaLapModule } from './ai-gia-lap/ai-gia-lap.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', '..', 'frontend'),
        serveRoot: '/',
      },
      {
        rootPath: join(__dirname, '..', '..', 'tai-lieu'),
        serveRoot: '/uploads',
      }
    ),
    ScheduleModule.forRoot(),
    CoSoDuLieuModule,
    BoNhoDemModule,
    XacThucModule,
    NguoiDungModule,
    ThietBiModule,
    CanhBaoModule,
    ThongKeModule,
    CaiDatModule,
    AiGiaLapModule,
  ],
})
export class UngDungModule {}

