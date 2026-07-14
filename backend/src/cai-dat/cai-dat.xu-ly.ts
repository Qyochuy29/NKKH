import { Injectable } from '@nestjs/common';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';

@Injectable()
export class CaiDatXuLy {
  constructor(private prisma: CoSoDuLieuXuLy) {}

  async findAll() {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    return result;
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async updateMany(settings: { key: string; value: string }[]) {
    const results: { key: string; value: string }[] = [];
    for (const s of settings) {
      const result = await this.prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
      results.push(result);
    }
    return results;
  }
}

