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
exports.AiGiaLapXuLy = void 0;
const common_1 = require("@nestjs/common");
const canh_bao_xu_ly_1 = require("../canh-bao/canh-bao.xu-ly");
const thiet_bi_xu_ly_1 = require("../thiet-bi/thiet-bi.xu-ly");
let AiGiaLapXuLy = class AiGiaLapXuLy {
    constructor(CanhBaoXuLy, ThietBiXuLy) {
        this.CanhBaoXuLy = CanhBaoXuLy;
        this.ThietBiXuLy = ThietBiXuLy;
        this.logger = new common_1.Logger('AiGiaLapXuLy');
        this.intervalRef = null;
    }
    onModuleInit() {
        const enabled = process.env.MOCK_AI_ENABLED !== 'false';
        if (enabled) {
            this.logger.log('🤖 Mock AI Service started — generating simulated alerts');
            this.scheduleNext();
        }
    }
    scheduleNext() {
        const minInterval = parseInt(process.env.MOCK_AI_INTERVAL_MIN || '15000', 10);
        const maxInterval = parseInt(process.env.MOCK_AI_INTERVAL_MAX || '40000', 10);
        const delay = minInterval + Math.floor(Math.random() * (maxInterval - minInterval));
        this.intervalRef = setTimeout(async () => {
            await this.generateAlert();
            this.scheduleNext();
        }, delay);
    }
    async generateAlert() {
        try {
            const devices = await this.ThietBiXuLy.getOnlineDevices();
            if (devices.length === 0) {
                this.logger.warn('No online devices available for mock alert');
                return;
            }
            const device = devices[Math.floor(Math.random() * devices.length)];
            const soundTypes = ['scream', 'help', 'threat', 'argument'];
            const soundType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
            const confidence = 60 + Math.random() * 39;
            const soundTypeLabels = {
                scream: 'La hét',
                help: 'Kêu cứu',
                threat: 'Đe dọa',
                argument: 'Cãi vã',
            };
            const alert = await this.submitDetection(device.id, soundType, parseFloat(confidence.toFixed(1)), `/assets/demo-audio-${soundType}.mp3`);
            this.logger.log(`⚠️ Mock alert generated: ${soundTypeLabels[soundType]} (${confidence.toFixed(1)}%) at ${device.area} [${device.name}]`);
            return alert;
        }
        catch (error) {
            this.logger.error('Failed to generate mock alert:', error);
        }
    }
    async submitDetection(deviceId, soundType, confidence, audioUrl) {
        return this.CanhBaoXuLy.submitDetection(deviceId, soundType, confidence, audioUrl);
    }
};
exports.AiGiaLapXuLy = AiGiaLapXuLy;
exports.AiGiaLapXuLy = AiGiaLapXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [canh_bao_xu_ly_1.CanhBaoXuLy,
        thiet_bi_xu_ly_1.ThietBiXuLy])
], AiGiaLapXuLy);
//# sourceMappingURL=ai-gia-lap.xu-ly.js.map