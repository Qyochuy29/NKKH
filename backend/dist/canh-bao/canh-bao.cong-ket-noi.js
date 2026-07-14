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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanhBaoCongKetNoi = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const bo_nho_dem_xu_ly_1 = require("../bo-nho-dem/bo-nho-dem.xu-ly");
const common_1 = require("@nestjs/common");
let CanhBaoCongKetNoi = class CanhBaoCongKetNoi {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger('CanhBaoCongKetNoi');
    }
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
        this.redis.subscribe('new-alert', (message) => {
            const alert = JSON.parse(message);
            this.server.emit('new-alert', alert);
            this.logger.log(`Broadcasting new alert: ${alert.id}`);
        });
        this.redis.subscribe('alert-updated', (message) => {
            const alert = JSON.parse(message);
            this.server.emit('alert-updated', alert);
            this.logger.log(`Broadcasting alert update: ${alert.id}`);
        });
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
};
exports.CanhBaoCongKetNoi = CanhBaoCongKetNoi;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CanhBaoCongKetNoi.prototype, "server", void 0);
exports.CanhBaoCongKetNoi = CanhBaoCongKetNoi = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/ws/alerts',
    }),
    __metadata("design:paramtypes", [bo_nho_dem_xu_ly_1.BoNhoDemXuLy])
], CanhBaoCongKetNoi);
//# sourceMappingURL=canh-bao.cong-ket-noi.js.map