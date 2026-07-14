"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UngDungModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const schedule_1 = require("@nestjs/schedule");
const path_1 = require("path");
const co_so_du_lieu_module_1 = require("./co-so-du-lieu/co-so-du-lieu.module");
const bo_nho_dem_module_1 = require("./bo-nho-dem/bo-nho-dem.module");
const xac_thuc_module_1 = require("./xac-thuc/xac-thuc.module");
const nguoi_dung_module_1 = require("./nguoi-dung/nguoi-dung.module");
const thiet_bi_module_1 = require("./thiet-bi/thiet-bi.module");
const canh_bao_module_1 = require("./canh-bao/canh-bao.module");
const thong_ke_module_1 = require("./thong-ke/thong-ke.module");
const cai_dat_module_1 = require("./cai-dat/cai-dat.module");
const ai_gia_lap_module_1 = require("./ai-gia-lap/ai-gia-lap.module");
let UngDungModule = class UngDungModule {
};
exports.UngDungModule = UngDungModule;
exports.UngDungModule = UngDungModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'frontend'),
                serveRoot: '/',
            }, {
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'tai-lieu'),
                serveRoot: '/uploads',
            }),
            schedule_1.ScheduleModule.forRoot(),
            co_so_du_lieu_module_1.CoSoDuLieuModule,
            bo_nho_dem_module_1.BoNhoDemModule,
            xac_thuc_module_1.XacThucModule,
            nguoi_dung_module_1.NguoiDungModule,
            thiet_bi_module_1.ThietBiModule,
            canh_bao_module_1.CanhBaoModule,
            thong_ke_module_1.ThongKeModule,
            cai_dat_module_1.CaiDatModule,
            ai_gia_lap_module_1.AiGiaLapModule,
        ],
    })
], UngDungModule);
//# sourceMappingURL=ung-dung.module.js.map
