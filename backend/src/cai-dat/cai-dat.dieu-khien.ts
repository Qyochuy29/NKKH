import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CaiDatXuLy } from './cai-dat.xu-ly';
import { BaoVeXacThucJwt } from '../xac-thuc/jwt-xac-thuc.bao-ve';

@Controller('api/settings')
@UseGuards(BaoVeXacThucJwt)
export class CaiDatDieuKhien {
  constructor(private CaiDatXuLy: CaiDatXuLy) {}

  @Get()
  findAll() {
    return this.CaiDatXuLy.findAll();
  }

  @Put()
  update(@Body() body: { settings: { key: string; value: string }[] }) {
    return this.CaiDatXuLy.updateMany(body.settings);
  }
}

