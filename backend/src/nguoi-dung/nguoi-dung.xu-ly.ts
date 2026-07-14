import { Injectable } from '@nestjs/common';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class NguoiDungXuLy {
  constructor(private prisma: CoSoDuLieuXuLy) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(data: { full_name: string; email: string; password: string; role: string }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        full_name: data.full_name,
        email: data.email,
        password_hash: passwordHash,
        role: data.role as Role,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  async update(id: string, data: { full_name?: string; email?: string; password?: string; role?: string }) {
    const updateData: any = {};
    if (data.full_name) updateData.full_name = data.full_name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role as Role;
    if (data.password) updateData.password_hash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

