"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThongKeXuLy = void 0;
const common_1 = require("@nestjs/common");
const co_so_du_lieu_xu_ly_1 = require("../co-so-du-lieu/co-so-du-lieu.xu-ly");
const client_1 = require("@prisma/client");
let ThongKeXuLy = class ThongKeXuLy {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [devicesOnline, totalDevices, alertsToday, pendingUrgent, avgResponseTime,] = await Promise.all([
            this.prisma.device.count({ where: { status: client_1.DeviceStatus.online } }),
            this.prisma.device.count(),
            this.prisma.alert.count({ where: { timestamp: { gte: today } } }),
            this.prisma.alert.count({
                where: {
                    status: client_1.AlertStatus.pending,
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
    async getAvgResponseTime() {
        const handled = await this.prisma.alert.findMany({
            where: {
                resolved_at: { not: null },
                timestamp: { gte: new Date(Date.now() - 7 * 86400000) },
            },
            select: { timestamp: true, resolved_at: true },
            take: 100,
        });
        if (handled.length === 0)
            return 0;
        const totalMs = handled.reduce((sum, a) => {
            return sum + (a.resolved_at.getTime() - a.timestamp.getTime());
        }, 0);
        return Math.round(totalMs / handled.length / 60000);
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
        const areaMap = {};
        alerts.forEach((a) => {
            const area = a.device.area.name;
            areaMap[area] = (areaMap[area] || 0) + 1;
        });
        return Object.entries(areaMap)
            .map(([area, count]) => ({ area, count }))
            .sort((a, b) => b.count - a.count);
    }
    async getTrend(period = 'day') {
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
        const groups = {};
        alerts.forEach((a) => {
            let key;
            const d = a.timestamp;
            if (groupFormat === 'month') {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }
            else if (groupFormat === 'week') {
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                key = weekStart.toISOString().split('T')[0];
            }
            else {
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
        const heatmap = {};
        alerts.forEach((a) => {
            const area = a.device.area.name;
            const hour = a.timestamp.getHours();
            if (!heatmap[area])
                heatmap[area] = {};
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
            this.prisma.alert.count({ where: { status: client_1.AlertStatus.confirmed } }),
            this.prisma.alert.count({ where: { status: client_1.AlertStatus.false_alarm } }),
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
};
exports.ThongKeXuLy = ThongKeXuLy;
exports.ThongKeXuLy = ThongKeXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [co_so_du_lieu_xu_ly_1.CoSoDuLieuXuLy])
], ThongKeXuLy);
//# sourceMappingURL=thong-ke.xu-ly.js.map