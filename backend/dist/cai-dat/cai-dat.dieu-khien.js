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
exports.CaiDatDieuKhien = void 0;
const common_1 = require("@nestjs/common");
const cai_dat_xu_ly_1 = require("./cai-dat.xu-ly");
const jwt_xac_thuc_bao_ve_1 = require("../xac-thuc/jwt-xac-thuc.bao-ve");
let CaiDatDieuKhien = class CaiDatDieuKhien {
    constructor(CaiDatXuLy) {
        this.CaiDatXuLy = CaiDatXuLy;
    }
    findAll() {
        return this.CaiDatXuLy.findAll();
    }
    update(body) {
        return this.CaiDatXuLy.updateMany(body.settings);
    }
};
exports.CaiDatDieuKhien = CaiDatDieuKhien;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CaiDatDieuKhien.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CaiDatDieuKhien.prototype, "update", null);
exports.CaiDatDieuKhien = CaiDatDieuKhien = __decorate([
    (0, common_1.Controller)('api/settings'),
    (0, common_1.UseGuards)(jwt_xac_thuc_bao_ve_1.BaoVeXacThucJwt),
    __metadata("design:paramtypes", [cai_dat_xu_ly_1.CaiDatXuLy])
], CaiDatDieuKhien);
//# sourceMappingURL=cai-dat.dieu-khien.js.map