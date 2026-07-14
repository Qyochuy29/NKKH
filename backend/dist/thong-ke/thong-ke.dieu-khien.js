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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThongKeDieuKhien = void 0;
const common_1 = require("@nestjs/common");
const thong_ke_xu_ly_1 = require("./thong-ke.xu-ly");
const jwt_xac_thuc_bao_ve_1 = require("../xac-thuc/jwt-xac-thuc.bao-ve");
let ThongKeDieuKhien = class ThongKeDieuKhien {
    constructor(ThongKeXuLy) {
        this.ThongKeXuLy = ThongKeXuLy;
    }
    getSummary() {
        return this.ThongKeXuLy.getSummary();
    }
    getByType() {
        return this.ThongKeXuLy.getByType();
    }
    getByArea() {
        return this.ThongKeXuLy.getByArea();
    }
    getTrend(period) {
        return this.ThongKeXuLy.getTrend(period || 'day');
    }
    getHeatmap() {
        return this.ThongKeXuLy.getHeatmap();
    }
    getRatio() {
        return this.ThongKeXuLy.getAlertRatio();
    }
    getHourlyToday() {
        return this.ThongKeXuLy.getHourlyToday();
    }
};
exports.ThongKeDieuKhien = ThongKeDieuKhien;
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('by-type'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getByType", null);
__decorate([
    (0, common_1.Get)('by-area'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getByArea", null);
__decorate([
    (0, common_1.Get)('trend'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getTrend", null);
__decorate([
    (0, common_1.Get)('heatmap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getHeatmap", null);
__decorate([
    (0, common_1.Get)('ratio'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getRatio", null);
__decorate([
    (0, common_1.Get)('hourly-today'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThongKeDieuKhien.prototype, "getHourlyToday", null);
exports.ThongKeDieuKhien = ThongKeDieuKhien = __decorate([
    (0, common_1.Controller)('api/statistics'),
    (0, common_1.UseGuards)(jwt_xac_thuc_bao_ve_1.BaoVeXacThucJwt),
    __metadata("design:paramtypes", [thong_ke_xu_ly_1.ThongKeXuLy])
], ThongKeDieuKhien);
//# sourceMappingURL=thong-ke.dieu-khien.js.map