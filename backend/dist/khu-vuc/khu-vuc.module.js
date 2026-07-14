"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KhuVucModule = void 0;
const common_1 = require("@nestjs/common");
const khu_vuc_dieu_khien_1 = require("./khu-vuc.dieu-khien");
const khu_vuc_xu_ly_1 = require("./khu-vuc.xu-ly");
let KhuVucModule = class KhuVucModule {
};
exports.KhuVucModule = KhuVucModule;
exports.KhuVucModule = KhuVucModule = __decorate([
    (0, common_1.Module)({
        controllers: [khu_vuc_dieu_khien_1.KhuVucDieuKhien],
        providers: [khu_vuc_xu_ly_1.KhuVucXuLy],
        exports: [khu_vuc_xu_ly_1.KhuVucXuLy],
    })
], KhuVucModule);
//# sourceMappingURL=khu-vuc.module.js.map