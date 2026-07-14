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
exports.CanhBaoXuLy = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const co_so_du_lieu_xu_ly_1 = require("../co-so-du-lieu/co-so-du-lieu.xu-ly");
const bo_nho_dem_xu_ly_1 = require("../bo-nho-dem/bo-nho-dem.xu-ly");
const client_1 = require("@prisma/client");
let CanhBaoXuLy = class CanhBaoXuLy {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger('CanhBaoXuLy');
    }
    async findAll(query, userRole) {
        const where = {};
        if (query.date_from || query.date_to) {
            where.timestamp = {};
            if (query.date_from)
                where.timestamp.gte = new Date(query.date_from);
            if (query.date_to)
                where.timestamp.lte = new Date(query.date_to);
        }
        if (query.sound_type) {
            where.sound_type = query.sound_type;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.area) {
            where.device = { area: { contains: query.area, mode: 'insensitive' } };
        }
        const [data, total] = await Promise.all([
            this.prisma.alert.findMany({
                where,
                include: {
                    device: { select: { id: true, name: true, area: true, floor: true } },
                    handled_by: { select: { id: true, full_name: true } },
                },
                orderBy: { timestamp: 'desc' },
                skip: query.offset || 0,
                take: query.limit || 20,
            }),
            this.prisma.alert.count({ where }),
        ]);
        const filteredData = data.map(alert => {
            if (userRole !== 'admin' && userRole !== 'ban_giam_hieu') {
                const { audio_file_url, ...rest } = alert;
                return rest;
            }
            return alert;
        });
        return { data: filteredData, total, offset: query.offset || 0, limit: query.limit || 20 };
    }
    async findOne(id, userRole) {
        const alert = await this.prisma.alert.findUnique({
            where: { id },
            include: {
                device: true,
                handled_by: { select: { id: true, full_name: true, role: true } },
                logs: {
                    include: { actor: { select: { id: true, full_name: true, role: true } } },
                    orderBy: { timestamp: 'asc' },
                },
            },
        });
        if (alert && userRole !== 'admin' && userRole !== 'ban_giam_hieu') {
            const { audio_file_url, ...rest } = alert;
            return rest;
        }
        return alert;
    }
    async submitDetection(deviceId, soundType, confidence, audioUrl, notes) {
        const alert = await this.prisma.alert.create({
            data: {
                device_id: deviceId,
                sound_type: soundType,
                confidence_score: confidence,
                audio_file_url: audioUrl || null,
                notes: notes || null,
                status: client_1.AlertStatus.pending,
            },
            include: {
                device: { select: { id: true, name: true, area: true, floor: true } },
            },
        });
        await this.redis.publish('new-alert', JSON.stringify(alert));
        return alert;
    }
    async analyzeUploadedAudio(audioUrl, originalName = '') {
        const devices = await this.prisma.device.findMany({ where: { status: 'online' } });
        const device = devices.length > 0
            ? devices[Math.floor(Math.random() * devices.length)]
            : await this.prisma.device.findFirst();
        if (!device) {
            throw new Error('No devices available to bind alert');
        }
        let soundType = 'argument';
        let confidence = 85;
        let notes = '';
        try {
            const absolutePath = `/app${audioUrl}`;
            const response = await fetch('http://ai-service:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filepath: absolutePath })
            });
            if (response.ok) {
                const result = await response.json();
                soundType = result.soundType;
                confidence = result.confidence;
                if (result.transcript) {
                    notes = `🗣 AI nghe được: "${result.transcript}"`;
                }
                else {
                    notes = `🔇 AI không nghe rõ tiếng (quá ồn hoặc lỗi thu âm).`;
                }
            }
            else {
                console.error('AI Service Error:', await response.text());
                soundType = ['scream', 'help', 'threat', 'argument'][Math.floor(Math.random() * 4)];
            }
        }
        catch (e) {
            console.error('Failed to reach AI service:', e.message);
            soundType = ['scream', 'help', 'threat', 'argument'][Math.floor(Math.random() * 4)];
        }
        return this.submitDetection(device.id, soundType, confidence, audioUrl, notes);
    }
    async updateAlert(id, data, userId) {
        const updateData = {};
        if (data.status) {
            updateData.status = data.status;
            if (data.status !== 'pending') {
                updateData.handled_by_id = userId;
                updateData.resolved_at = new Date();
            }
        }
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.is_evidence !== undefined)
            updateData.is_evidence = data.is_evidence;
        const alert = await this.prisma.alert.update({
            where: { id },
            data: updateData,
            include: {
                device: { select: { id: true, name: true, area: true, floor: true } },
                handled_by: { select: { id: true, full_name: true } },
            },
        });
        if (data.status) {
            const actionMap = {
                confirmed: 'Xác nhận sự cố',
                false_alarm: 'Đánh dấu báo động giả',
                resolved: 'Đã xử lý xong',
            };
            await this.prisma.alertLog.create({
                data: {
                    alert_id: id,
                    action: actionMap[data.status] || `Cập nhật: ${data.status}`,
                    actor_id: userId,
                },
            });
        }
        await this.redis.publish('alert-updated', JSON.stringify(alert));
        return alert;
    }
    async getPendingCount() {
        return this.prisma.alert.count({
            where: { status: client_1.AlertStatus.pending },
        });
    }
    async cleanupOldAudio() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const result = await this.prisma.alert.updateMany({
            where: {
                timestamp: { lt: thirtyDaysAgo },
                is_evidence: false,
                audio_file_url: { not: null },
            },
            data: {
                audio_file_url: null,
            },
        });
        if (result.count > 0) {
            this.logger.log(`🗑️ Cleaned up audio URLs for ${result.count} old alerts`);
        }
    }
};
exports.CanhBaoXuLy = CanhBaoXuLy;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CanhBaoXuLy.prototype, "cleanupOldAudio", null);
exports.CanhBaoXuLy = CanhBaoXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [co_so_du_lieu_xu_ly_1.CoSoDuLieuXuLy,
        bo_nho_dem_xu_ly_1.BoNhoDemXuLy])
], CanhBaoXuLy);
//# sourceMappingURL=canh-bao.xu-ly.js.map
