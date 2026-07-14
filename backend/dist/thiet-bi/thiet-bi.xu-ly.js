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
exports.ThietBiXuLy = void 0;
const common_1 = require("@nestjs/common");
const co_so_du_lieu_xu_ly_1 = require("../co-so-du-lieu/co-so-du-lieu.xu-ly");
const client_1 = require("@prisma/client");
const AREA_INCLUDE = { area: { select: { id: true, name: true } } };
let ThietBiXuLy = class ThietBiXuLy {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.device.findMany({
            include: AREA_INCLUDE,
            orderBy: [{ floor: 'asc' }, { name: 'asc' }],
        });
    }
    async findOne(id) {
        return this.prisma.device.findUnique({ where: { id }, include: AREA_INCLUDE });
    }
    async create(data) {
        return this.prisma.device.create({ data, include: AREA_INCLUDE });
    }
    async update(id, data) {
        if (data.status) {
            data.status = data.status;
        }
        return this.prisma.device.update({
            where: { id },
            data: { ...data, last_seen: new Date() },
            include: AREA_INCLUDE,
        });
    }
    async getStatus(id) {
        return this.prisma.device.findUnique({
            where: { id },
            select: { id: true, name: true, status: true, battery_level: true, last_seen: true },
        });
    }
    async getOnlineDevices() {
        return this.prisma.device.findMany({
            where: { status: client_1.DeviceStatus.online },
            include: AREA_INCLUDE,
        });
    }
};
exports.ThietBiXuLy = ThietBiXuLy;
exports.ThietBiXuLy = ThietBiXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [co_so_du_lieu_xu_ly_1.CoSoDuLieuXuLy])
], ThietBiXuLy);
//# sourceMappingURL=thiet-bi.xu-ly.js.map