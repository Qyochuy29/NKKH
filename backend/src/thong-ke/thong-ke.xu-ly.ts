import { Injectable } from '@nestjs/common';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
import { AlertStatus, DeviceStatus } from '@prisma/client';

@Injectable()
export class ThongKeXuLy {
  constructor(private prisma: CoSoDuLieuXuLy) {}

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      devicesOnline,
      totalDevices,
      alertsToday,
      pendingUrgent,
      avgResponseTime,
    ] = await Promise.all([
      this.prisma.device.count({ where: { status: DeviceStatus.online } }),
      this.prisma.device.count(),
      this.prisma.alert.count({ where: { timestamp: { gte: today } } }),
      this.prisma.alert.count({
        where: {
          status: AlertStatus.pending,
          confidence_score: { gte: 80 },
        },
      }),
      this.getAvgResponseTime(),
    ]);

    return {
      devices_online: devicesOnline,
      total_devices: totalDevices,
      alerts_today: alertsToday,
      pending_urgent: pendingUrgent,
      avg_response_minutes: avgResponseTime,
    };
  }

  private async getAvgResponseTime(): Promise<number> {
    const handled = await this.prisma.alert.findMany({
      where: {
        resolved_at: { not: null },
        timestamp: { gte: new Date(Date.now() - 7 * 86400000) },
      },
      select: { timestamp: true, resolved_at: true },
      take: 100,
    });

    if (handled.length === 0) return 0;

    const totalMs = handled.reduce((sum, a) => {
      return sum + (a.resolved_at!.getTime() - a.timestamp.getTime());
    }, 0);

    return Math.round(totalMs / handled.length / 60000); // Convert to minutes
  }

  async getByType() {
    const result = await this.prisma.alert.groupBy({
      by: ['sound_type'],
      _count: { id: true },
    });

    return result.map((r) => ({
      sound_type: r.sound_type,
      count: r._count.id,
    }));
  }

  async getByArea() {
    const alerts = await this.prisma.alert.findMany({
      include: { device: { select: { area: { select: { name: true } } } } },
    });

    const areaMap: Record<string, number> = {};
    alerts.forEach((a) => {
      const area = a.device.area.name;
      areaMap[area] = (areaMap[area] || 0) + 1;
    });

    return Object.entries(areaMap)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getTrend(period: string = 'day') {
    const now = new Date();
    let daysBack = 7;
    let groupFormat = 'day';

    switch (period) {
      case 'week':
        daysBack = 28;
        groupFormat = 'week';
        break;
      case 'month':
        daysBack = 180;
        groupFormat = 'month';
        break;
      default:
        daysBack = 7;
        groupFormat = 'day';
    }

    const since = new Date(now.getTime() - daysBack * 86400000);

    const alerts = await this.prisma.alert.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true, sound_type: true },
      orderBy: { timestamp: 'asc' },
    });

    const groups: Record<string, number> = {};
    alerts.forEach((a) => {
      let key: string;
      const d = a.timestamp;
      if (groupFormat === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupFormat === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = d.toISOString().split('T')[0];
      }
      groups[key] = (groups[key] || 0) + 1;
    });

    return Object.entries(groups).map(([date, count]) => ({ date, count }));
  }

  async getHeatmap() {
    const alerts = await this.prisma.alert.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { timestamp: true, device: { select: { area: { select: { name: true } } } } },
    });

    const heatmap: Record<string, Record<number, number>> = {};

    alerts.forEach((a) => {
      const area = a.device.area.name;
      const hour = a.timestamp.getHours();
      if (!heatmap[area]) heatmap[area] = {};
      heatmap[area][hour] = (heatmap[area][hour] || 0) + 1;
    });

    return Object.entries(heatmap).map(([area, hours]) => ({
      area,
      hours: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        count: hours[h] || 0,
      })),
    }));
  }

  async getAlertRatio() {
    const [confirmed, falseAlarm, total] = await Promise.all([
      this.prisma.alert.count({ where: { status: AlertStatus.confirmed } }),
      this.prisma.alert.count({ where: { status: AlertStatus.false_alarm } }),
      this.prisma.alert.count(),
    ]);

    return { confirmed, false_alarm: falseAlarm, pending: total - confirmed - falseAlarm, total };
  }

  async getHourlyToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts = await this.prisma.alert.findMany({
      where: { timestamp: { gte: today } },
      select: { timestamp: true },
    });

    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    alerts.forEach((a) => {
      const h = a.timestamp.getHours();
      hourly[h].count++;
    });

    return hourly;
  }
}

