import { Injectable } from '@nestjs/common';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
import { DeviceStatus } from '@prisma/client';

@Injectable()
export class ThietBiXuLy {
  constructor(private prisma: CoSoDuLieuXuLy) {}

  async findAll() {
    return this.prisma.device.findMany({
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.device.findUnique({ where: { id } });
  }

  async create(data: { name: string; area: string; floor: number; position_x: number; position_y: number }) {
    return this.prisma.device.create({ data });
  }

  async update(id: string, data: any) {
    if (data.status) {
      data.status = data.status as DeviceStatus;
    }
    return this.prisma.device.update({
      where: { id },
      data: { ...data, last_seen: new Date() },
    });
  }

  async getStatus(id: string) {
    return this.prisma.device.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, battery_level: true, last_seen: true },
    });
  }

  async getOnlineDevices() {
    return this.prisma.device.findMany({
      where: { status: DeviceStatus.online },
    });
  }
}

