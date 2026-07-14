"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NguoiDungModule = void 0;
const common_1 = require("@nestjs/common");
const nguoi_dung_dieu_khien_1 = require("./nguoi-dung.dieu-khien");
const nguoi_dung_xu_ly_1 = require("./nguoi-dung.xu-ly");
let NguoiDungModule = class NguoiDungModule {
};
exports.NguoiDungModule = NguoiDungModule;
exports.NguoiDungModule = NguoiDungModule = __decorate([
    (0, common_1.Module)({
        controllers: [nguoi_dung_dieu_khien_1.NguoiDungDieuKhien],
        providers: [nguoi_dung_xu_ly_1.NguoiDungXuLy],
        exports: [nguoi_dung_xu_ly_1.NguoiDungXuLy],
    })
], NguoiDungModule);
//# sourceMappingURL=nguoi-dung.module.js.map