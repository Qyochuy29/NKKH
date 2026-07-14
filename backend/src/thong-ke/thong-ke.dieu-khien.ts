import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ThongKeXuLy } from './thong-ke.xu-ly';
import { BaoVeXacThucJwt } from '../xac-thuc/jwt-xac-thuc.bao-ve';

@Controller('api/statistics')
@UseGuards(BaoVeXacThucJwt)
export class ThongKeDieuKhien {
  constructor(private ThongKeXuLy: ThongKeXuLy) {}

  @Get('summary')
  getSummary() {
    return this.ThongKeXuLy.getSummary();
  }

  @Get('by-type')
  getByType() {
    return this.ThongKeXuLy.getByType();
  }

  @Get('by-area')
  getByArea() {
    return this.ThongKeXuLy.getByArea();
  }

  @Get('trend')
  getTrend(@Query('period') period: string) {
    return this.ThongKeXuLy.getTrend(period || 'day');
  }

  @Get('heatmap')
  getHeatmap() {
    return this.ThongKeXuLy.getHeatmap();
  }

  @Get('ratio')
  getRatio() {
    return this.ThongKeXuLy.getAlertRatio();
  }

  @Get('hourly-today')
  getHourlyToday() {
    return this.ThongKeXuLy.getHourlyToday();
  }
}

