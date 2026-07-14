import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { XacThucXuLy } from './xac-thuc.xu-ly';
import { DangNhapDto, LamMoiDto } from './du-lieu-vao/xac-thuc.dto';
import { BaoVeXacThucJwt } from './jwt-xac-thuc.bao-ve';

@Controller('api/auth')
export class XacThucDieuKhien {
  constructor(private XacThucXuLy: XacThucXuLy) {}

  @Post('login')
  async login(@Body() dto: DangNhapDto) {
    return this.XacThucXuLy.login(dto.email, dto.password);
  }

  @Post('refresh')
  async refresh(@Body() dto: LamMoiDto) {
    return this.XacThucXuLy.refresh(dto.refresh_token);
  }

  @UseGuards(BaoVeXacThucJwt)
  @Get('me')
  async me(@Request() req) {
    return this.XacThucXuLy.getProfile(req.user.sub);
  }
}

