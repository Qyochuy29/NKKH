import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CanhBaoXuLy } from './canh-bao.xu-ly';
import { BaoVeXacThucJwt } from '../xac-thuc/jwt-xac-thuc.bao-ve';
import { TaoCanhBaoDto, CapNhatCanhBaoDto, TruyVanCanhBaoDto } from './du-lieu-vao/canh-bao.dto';

@Controller('api/alerts')
@UseGuards(BaoVeXacThucJwt)
export class CanhBaoDieuKhien {
  constructor(private CanhBaoXuLy: CanhBaoXuLy) { }

  @Get()
  findAll(@Query() query: TruyVanCanhBaoDto, @Request() req) {
    return this.CanhBaoXuLy.findAll(query, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.CanhBaoXuLy.findOne(id, req.user.role);
  }

  @Post()
  create(@Body() dto: TaoCanhBaoDto) {
    return this.CanhBaoXuLy.submitDetection(
      dto.device_id,
      dto.sound_type,
      dto.confidence_score,
      dto.audio_file_url,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadAudio(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    return this.CanhBaoXuLy.analyzeUploadedAudio(`/uploads/${file.filename}`, file.originalname);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CapNhatCanhBaoDto, @Request() req) {
    return this.CanhBaoXuLy.updateAlert(id, dto, req.user.sub);
  }
}

