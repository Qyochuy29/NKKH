import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { NguoiDungXuLy } from './nguoi-dung.xu-ly';
import { BaoVeXacThucJwt } from '../xac-thuc/jwt-xac-thuc.bao-ve';
import { BaoVeVaiTro } from '../xac-thuc/vai-tro.bao-ve';
import { Roles } from '../xac-thuc/vai-tro.trang-tri';
import { TaoNguoiDungDto, CapNhatNguoiDungDto } from './du-lieu-vao/nguoi-dung.dto';

@Controller('api/users')
@UseGuards(BaoVeXacThucJwt, BaoVeVaiTro)
export class NguoiDungDieuKhien {
  constructor(private NguoiDungXuLy: NguoiDungXuLy) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.NguoiDungXuLy.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: TaoNguoiDungDto) {
    return this.NguoiDungXuLy.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: CapNhatNguoiDungDto) {
    return this.NguoiDungXuLy.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.NguoiDungXuLy.remove(id);
  }
}

