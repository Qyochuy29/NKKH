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
exports.CanhBaoDieuKhien = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const canh_bao_xu_ly_1 = require("./canh-bao.xu-ly");
const jwt_xac_thuc_bao_ve_1 = require("../xac-thuc/jwt-xac-thuc.bao-ve");
const canh_bao_dto_1 = require("./du-lieu-vao/canh-bao.dto");
let CanhBaoDieuKhien = class CanhBaoDieuKhien {
    constructor(CanhBaoXuLy) {
        this.CanhBaoXuLy = CanhBaoXuLy;
    }
    findAll(query, req) {
        return this.CanhBaoXuLy.findAll(query, req.user.role);
    }
    findOne(id, req) {
        return this.CanhBaoXuLy.findOne(id, req.user.role);
    }
    create(dto) {
        return this.CanhBaoXuLy.submitDetection(dto.device_id, dto.sound_type, dto.confidence_score, dto.audio_file_url);
    }
    async uploadAudio(file, req) {
        if (!file) {
            return { error: 'No file uploaded' };
        }
        return this.CanhBaoXuLy.analyzeUploadedAudio(`/uploads/${file.filename}`, file.originalname);
    }
    update(id, dto, req) {
        return this.CanhBaoXuLy.updateAlert(id, dto, req.user.sub);
    }
};
exports.CanhBaoDieuKhien = CanhBaoDieuKhien;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [canh_bao_dto_1.TruyVanCanhBaoDto, Object]),
    __metadata("design:returntype", void 0)
], CanhBaoDieuKhien.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CanhBaoDieuKhien.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [canh_bao_dto_1.TaoCanhBaoDto]),
    __metadata("design:returntype", void 0)
], CanhBaoDieuKhien.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            }
        })
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CanhBaoDieuKhien.prototype, "uploadAudio", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, canh_bao_dto_1.CapNhatCanhBaoDto, Object]),
    __metadata("design:returntype", void 0)
], CanhBaoDieuKhien.prototype, "update", null);
exports.CanhBaoDieuKhien = CanhBaoDieuKhien = __decorate([
    (0, common_1.Controller)('api/alerts'),
    (0, common_1.UseGuards)(jwt_xac_thuc_bao_ve_1.BaoVeXacThucJwt),
    __metadata("design:paramtypes", [canh_bao_xu_ly_1.CanhBaoXuLy])
], CanhBaoDieuKhien);
//# sourceMappingURL=canh-bao.dieu-khien.js.map