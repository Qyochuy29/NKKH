"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NguoiDungXuLy = void 0;
const common_1 = require("@nestjs/common");
const co_so_du_lieu_xu_ly_1 = require("../co-so-du-lieu/co-so-du-lieu.xu-ly");
const bcrypt = __importStar(require("bcrypt"));
let NguoiDungXuLy = class NguoiDungXuLy {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async create(data) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                full_name: data.full_name,
                email: data.email,
                password_hash: passwordHash,
                role: data.role,
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                created_at: true,
            },
        });
    }
    async update(id, data) {
        const updateData = {};
        if (data.full_name)
            updateData.full_name = data.full_name;
        if (data.email)
            updateData.email = data.email;
        if (data.role)
            updateData.role = data.role;
        if (data.password)
            updateData.password_hash = await bcrypt.hash(data.password, 10);
        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                created_at: true,
            },
        });
    }
    async remove(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
};
exports.NguoiDungXuLy = NguoiDungXuLy;
exports.NguoiDungXuLy = NguoiDungXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [co_so_du_lieu_xu_ly_1.CoSoDuLieuXuLy])
], NguoiDungXuLy);
//# sourceMappingURL=nguoi-dung.xu-ly.js.map