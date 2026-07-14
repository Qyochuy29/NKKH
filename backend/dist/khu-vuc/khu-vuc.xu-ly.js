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
exports.KhuVucXuLy = void 0;
const common_1 = require("@nestjs/common");
const co_so_du_lieu_xu_ly_1 = require("../co-so-du-lieu/co-so-du-lieu.xu-ly");
let KhuVucXuLy = class KhuVucXuLy {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findOne(id) {
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
        if (!area)
            throw new common_1.NotFoundException('Không tìm thấy khu vực');
        return area;
    }
    async create(data) {
        try {
            return await this.prisma.area.create({ data });
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.BadRequestException('Tên khu vực đã tồn tại');
            }
            throw e;
        }
    }
    async update(id, data) {
        try {
            return await this.prisma.area.update({ where: { id }, data });
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.BadRequestException('Tên khu vực đã tồn tại');
            }
            if (e.code === 'P2025') {
                throw new common_1.NotFoundException('Không tìm thấy khu vực');
            }
            throw e;
        }
    }
    async remove(id) {
        const count = await this.prisma.device.count({ where: { area_id: id } });
        if (count > 0) {
            throw new common_1.BadRequestException(`Không thể xoá khu vực vì còn ${count} thiết bị đang sử dụng`);
        }
        try {
            return await this.prisma.area.delete({ where: { id } });
        }
        catch (e) {
            if (e.code === 'P2025') {
                throw new common_1.NotFoundException('Không tìm thấy khu vực');
            }
            throw e;
        }
    }
};
exports.KhuVucXuLy = KhuVucXuLy;
exports.KhuVucXuLy = KhuVucXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [co_so_du_lieu_xu_ly_1.CoSoDuLieuXuLy])
], KhuVucXuLy);
//# sourceMappingURL=khu-vuc.xu-ly.js.map