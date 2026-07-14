import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';

@Injectable()
export class KhuVucXuLy {
  constructor(private prisma: CoSoDuLieuXuLy) {}

  async findAll() {
    const areas = await this.prisma.area.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { devices: true } },
      },
    });
    return areas.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      created_at: a.created_at,
      device_count: a._count.devices,
    }));
  }

  async findOne(id: string) {
    const area = await this.prisma.area.findUnique({
      where: { id },
      include: {
        _count: { select: { devices: true } },
        devices: {
          select: { id: true, name: true, status: true, floor: true },
          orderBy: { floor: 'asc' },
        },
      },
    });
    if (!area) throw new NotFoundException('Không tìm thấy khu vực');
    return area;
  }

  async create(data: { name: string; description?: string }) {
    try {
      return await this.prisma.area.create({ data });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Tên khu vực đã tồn tại');
      }
      throw e;
    }
  }

  async update(id: string, data: { name?: string; description?: string }) {
    try {
      return await this.prisma.area.update({ where: { id }, data });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Tên khu vực đã tồn tại');
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy khu vực');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const count = await this.prisma.device.count({ where: { area_id: id } });
    if (count > 0) {
      throw new BadRequestException(
        `Không thể xoá khu vực vì còn ${count} thiết bị đang sử dụng`,
      );
    }
    try {
      return await this.prisma.area.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy khu vực');
      }
      throw e;
    }
  }
}
