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
exports.KhuVucDieuKhien = void 0;
const common_1 = require("@nestjs/common");
const khu_vuc_xu_ly_1 = require("./khu-vuc.xu-ly");
const jwt_xac_thuc_bao_ve_1 = require("../xac-thuc/jwt-xac-thuc.bao-ve");
const khu_vuc_dto_1 = require("./du-lieu-vao/khu-vuc.dto");
let KhuVucDieuKhien = class KhuVucDieuKhien {
    constructor(khuVucXuLy) {
        this.khuVucXuLy = khuVucXuLy;
    }
    findAll() {
        return this.khuVucXuLy.findAll();
    }
    findOne(id) {
        return this.khuVucXuLy.findOne(id);
    }
    create(dto) {
        return this.khuVucXuLy.create(dto);
    }
    update(id, dto) {
        return this.khuVucXuLy.update(id, dto);
    }
    remove(id) {
        return this.khuVucXuLy.remove(id);
    }
};
exports.KhuVucDieuKhien = KhuVucDieuKhien;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KhuVucDieuKhien.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KhuVucDieuKhien.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [khu_vuc_dto_1.TaoKhuVucDto]),
    __metadata("design:returntype", void 0)
], KhuVucDieuKhien.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, khu_vuc_dto_1.CapNhatKhuVucDto]),
    __metadata("design:returntype", void 0)
], KhuVucDieuKhien.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KhuVucDieuKhien.prototype, "remove", null);
exports.KhuVucDieuKhien = KhuVucDieuKhien = __decorate([
    (0, common_1.Controller)('api/areas'),
    (0, common_1.UseGuards)(jwt_xac_thuc_bao_ve_1.BaoVeXacThucJwt),
    __metadata("design:paramtypes", [khu_vuc_xu_ly_1.KhuVucXuLy])
], KhuVucDieuKhien);
//# sourceMappingURL=khu-vuc.dieu-khien.js.map