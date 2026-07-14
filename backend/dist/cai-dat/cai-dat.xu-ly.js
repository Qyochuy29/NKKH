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
exports.CaiDatXuLy = void 0;
const common_1 = require("@nestjs/common");
const co_so_du_lieu_xu_ly_1 = require("../co-so-du-lieu/co-so-du-lieu.xu-ly");
let CaiDatXuLy = class CaiDatXuLy {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const settings = await this.prisma.setting.findMany();
        const result = {};
        settings.forEach((s) => {
            result[s.key] = s.value;
        });
        return result;
    }
    async get(key) {
        const setting = await this.prisma.setting.findUnique({ where: { key } });
        return setting?.value || null;
    }
    async updateMany(settings) {
        const results = [];
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
};
exports.CaiDatXuLy = CaiDatXuLy;
exports.CaiDatXuLy = CaiDatXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [co_so_du_lieu_xu_ly_1.CoSoDuLieuXuLy])
], CaiDatXuLy);
//# sourceMappingURL=cai-dat.xu-ly.js.map
