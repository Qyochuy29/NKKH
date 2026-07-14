"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaiDatModule = void 0;
const common_1 = require("@nestjs/common");
const cai_dat_dieu_khien_1 = require("./cai-dat.dieu-khien");
const cai_dat_xu_ly_1 = require("./cai-dat.xu-ly");
let CaiDatModule = class CaiDatModule {
};
exports.CaiDatModule = CaiDatModule;
exports.CaiDatModule = CaiDatModule = __decorate([
    (0, common_1.Module)({
        controllers: [cai_dat_dieu_khien_1.CaiDatDieuKhien],
        providers: [cai_dat_xu_ly_1.CaiDatXuLy],
        exports: [cai_dat_xu_ly_1.CaiDatXuLy],
    })
], CaiDatModule);
//# sourceMappingURL=cai-dat.module.js.map
