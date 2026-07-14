import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ThietBiXuLy } from './thiet-bi.xu-ly';
import { BaoVeXacThucJwt } from '../xac-thuc/jwt-xac-thuc.bao-ve';
import { TaoThietBiDto, CapNhatThietBiDto } from './du-lieu-vao/thiet-bi.dto';

@Controller('api/devices')
@UseGuards(BaoVeXacThucJwt)
export class ThietBiDieuKhien {
  constructor(private ThietBiXuLy: ThietBiXuLy) {}

  @Get()
  findAll() {
    return this.ThietBiXuLy.findAll();
  }

  @Post()
  create(@Body() dto: TaoThietBiDto) {
    return this.ThietBiXuLy.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CapNhatThietBiDto) {
    return this.ThietBiXuLy.update(id, dto);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.ThietBiXuLy.getStatus(id);
  }
}

