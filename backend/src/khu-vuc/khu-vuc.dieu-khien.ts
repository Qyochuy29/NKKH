import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { KhuVucXuLy } from './khu-vuc.xu-ly';
import { BaoVeXacThucJwt } from '../xac-thuc/jwt-xac-thuc.bao-ve';
import { TaoKhuVucDto, CapNhatKhuVucDto } from './du-lieu-vao/khu-vuc.dto';

@Controller('api/areas')
@UseGuards(BaoVeXacThucJwt)
export class KhuVucDieuKhien {
  constructor(private khuVucXuLy: KhuVucXuLy) {}

  @Get()
  findAll() {
    return this.khuVucXuLy.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.khuVucXuLy.findOne(id);
  }

  @Post()
  create(@Body() dto: TaoKhuVucDto) {
    return this.khuVucXuLy.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CapNhatKhuVucDto) {
    return this.khuVucXuLy.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.khuVucXuLy.remove(id);
  }
}
