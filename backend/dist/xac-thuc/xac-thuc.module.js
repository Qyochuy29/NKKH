"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XacThucModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const xac_thuc_dieu_khien_1 = require("./xac-thuc.dieu-khien");
const xac_thuc_xu_ly_1 = require("./xac-thuc.xu-ly");
const jwt_chien_luoc_1 = require("./jwt.chien-luoc");
let XacThucModule = class XacThucModule {
};
exports.XacThucModule = XacThucModule;
exports.XacThucModule = XacThucModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'school-guardian-jwt-secret-key-2024',
                signOptions: { expiresIn: '30m' },
            }),
        ],
        controllers: [xac_thuc_dieu_khien_1.XacThucDieuKhien],
        providers: [xac_thuc_xu_ly_1.XacThucXuLy, jwt_chien_luoc_1.ChienLuocJwt],
        exports: [xac_thuc_xu_ly_1.XacThucXuLy, jwt_1.JwtModule],
    })
], XacThucModule);
//# sourceMappingURL=xac-thuc.module.js.map
