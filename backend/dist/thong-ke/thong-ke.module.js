"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThongKeModule = void 0;
const common_1 = require("@nestjs/common");
const thong_ke_dieu_khien_1 = require("./thong-ke.dieu-khien");
const thong_ke_xu_ly_1 = require("./thong-ke.xu-ly");
let ThongKeModule = class ThongKeModule {
};
exports.ThongKeModule = ThongKeModule;
exports.ThongKeModule = ThongKeModule = __decorate([
    (0, common_1.Module)({
        controllers: [thong_ke_dieu_khien_1.ThongKeDieuKhien],
        providers: [thong_ke_xu_ly_1.ThongKeXuLy],
    })
], ThongKeModule);
//# sourceMappingURL=thong-ke.module.js.map
