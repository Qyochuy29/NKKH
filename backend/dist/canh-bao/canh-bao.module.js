"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanhBaoModule = void 0;
const common_1 = require("@nestjs/common");
const canh_bao_dieu_khien_1 = require("./canh-bao.dieu-khien");
const canh_bao_xu_ly_1 = require("./canh-bao.xu-ly");
const canh_bao_cong_ket_noi_1 = require("./canh-bao.cong-ket-noi");
let CanhBaoModule = class CanhBaoModule {
};
exports.CanhBaoModule = CanhBaoModule;
exports.CanhBaoModule = CanhBaoModule = __decorate([
    (0, common_1.Module)({
        controllers: [canh_bao_dieu_khien_1.CanhBaoDieuKhien],
        providers: [canh_bao_xu_ly_1.CanhBaoXuLy, canh_bao_cong_ket_noi_1.CanhBaoCongKetNoi],
        exports: [canh_bao_xu_ly_1.CanhBaoXuLy],
    })
], CanhBaoModule);
//# sourceMappingURL=canh-bao.module.js.map
