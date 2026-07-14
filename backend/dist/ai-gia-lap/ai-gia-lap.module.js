"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGiaLapModule = void 0;
const common_1 = require("@nestjs/common");
const ai_gia_lap_xu_ly_1 = require("./ai-gia-lap.xu-ly");
const canh_bao_module_1 = require("../canh-bao/canh-bao.module");
const thiet_bi_module_1 = require("../thiet-bi/thiet-bi.module");
let AiGiaLapModule = class AiGiaLapModule {
};
exports.AiGiaLapModule = AiGiaLapModule;
exports.AiGiaLapModule = AiGiaLapModule = __decorate([
    (0, common_1.Module)({
        imports: [canh_bao_module_1.CanhBaoModule, thiet_bi_module_1.ThietBiModule],
        providers: [ai_gia_lap_xu_ly_1.AiGiaLapXuLy],
    })
], AiGiaLapModule);
//# sourceMappingURL=ai-gia-lap.module.js.map
