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
exports.ThietBiDieuKhien = void 0;
const common_1 = require("@nestjs/common");
const thiet_bi_xu_ly_1 = require("./thiet-bi.xu-ly");
const jwt_xac_thuc_bao_ve_1 = require("../xac-thuc/jwt-xac-thuc.bao-ve");
const thiet_bi_dto_1 = require("./du-lieu-vao/thiet-bi.dto");
let ThietBiDieuKhien = class ThietBiDieuKhien {
    constructor(ThietBiXuLy) {
        this.ThietBiXuLy = ThietBiXuLy;
    }
    findAll() {
        return this.ThietBiXuLy.findAll();
    }
    create(dto) {
        return this.ThietBiXuLy.create(dto);
    }
    update(id, dto) {
        return this.ThietBiXuLy.update(id, dto);
    }
    getStatus(id) {
        return this.ThietBiXuLy.getStatus(id);
    }
};
exports.ThietBiDieuKhien = ThietBiDieuKhien;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThietBiDieuKhien.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [thiet_bi_dto_1.TaoThietBiDto]),
    __metadata("design:returntype", void 0)
], ThietBiDieuKhien.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, thiet_bi_dto_1.CapNhatThietBiDto]),
    __metadata("design:returntype", void 0)
], ThietBiDieuKhien.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ThietBiDieuKhien.prototype, "getStatus", null);
exports.ThietBiDieuKhien = ThietBiDieuKhien = __decorate([
    (0, common_1.Controller)('api/devices'),
    (0, common_1.UseGuards)(jwt_xac_thuc_bao_ve_1.BaoVeXacThucJwt),
    __metadata("design:paramtypes", [thiet_bi_xu_ly_1.ThietBiXuLy])
], ThietBiDieuKhien);
//# sourceMappingURL=thiet-bi.dieu-khien.js.map