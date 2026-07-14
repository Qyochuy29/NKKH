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
exports.NguoiDungDieuKhien = void 0;
const common_1 = require("@nestjs/common");
const nguoi_dung_xu_ly_1 = require("./nguoi-dung.xu-ly");
const jwt_xac_thuc_bao_ve_1 = require("../xac-thuc/jwt-xac-thuc.bao-ve");
const vai_tro_bao_ve_1 = require("../xac-thuc/vai-tro.bao-ve");
const vai_tro_trang_tri_1 = require("../xac-thuc/vai-tro.trang-tri");
const nguoi_dung_dto_1 = require("./du-lieu-vao/nguoi-dung.dto");
let NguoiDungDieuKhien = class NguoiDungDieuKhien {
    constructor(NguoiDungXuLy) {
        this.NguoiDungXuLy = NguoiDungXuLy;
    }
    findAll() {
        return this.NguoiDungXuLy.findAll();
    }
    create(dto) {
        return this.NguoiDungXuLy.create(dto);
    }
    update(id, dto) {
        return this.NguoiDungXuLy.update(id, dto);
    }
    remove(id) {
        return this.NguoiDungXuLy.remove(id);
    }
};
exports.NguoiDungDieuKhien = NguoiDungDieuKhien;
__decorate([
    (0, common_1.Get)(),
    (0, vai_tro_trang_tri_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NguoiDungDieuKhien.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, vai_tro_trang_tri_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [nguoi_dung_dto_1.TaoNguoiDungDto]),
    __metadata("design:returntype", void 0)
], NguoiDungDieuKhien.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, vai_tro_trang_tri_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, nguoi_dung_dto_1.CapNhatNguoiDungDto]),
    __metadata("design:returntype", void 0)
], NguoiDungDieuKhien.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, vai_tro_trang_tri_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NguoiDungDieuKhien.prototype, "remove", null);
exports.NguoiDungDieuKhien = NguoiDungDieuKhien = __decorate([
    (0, common_1.Controller)('api/users'),
    (0, common_1.UseGuards)(jwt_xac_thuc_bao_ve_1.BaoVeXacThucJwt, vai_tro_bao_ve_1.BaoVeVaiTro),
    __metadata("design:paramtypes", [nguoi_dung_xu_ly_1.NguoiDungXuLy])
], NguoiDungDieuKhien);
//# sourceMappingURL=nguoi-dung.dieu-khien.js.map