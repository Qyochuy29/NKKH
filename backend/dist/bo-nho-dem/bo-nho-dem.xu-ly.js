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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoNhoDemXuLy = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let BoNhoDemXuLy = class BoNhoDemXuLy {
    constructor() {
        this.handlers = new Map();
        this.listenerRegistered = false;
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = new ioredis_1.default(url);
        this.subscriber = new ioredis_1.default(url);
    }
    getClient() {
        return this.client;
    }
    async publish(channel, message) {
        await this.client.publish(channel, message);
    }
    async subscribe(channel, callback) {
        this.handlers.set(channel, callback);
        await this.subscriber.subscribe(channel);
        if (!this.listenerRegistered) {
            this.listenerRegistered = true;
            this.subscriber.on('message', (ch, msg) => {
                const handler = this.handlers.get(ch);
                if (handler)
                    handler(msg);
            });
        }
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        return this.client.get(key);
    }
    async del(key) {
        await this.client.del(key);
    }
    async onModuleDestroy() {
        await this.client.quit();
        await this.subscriber.quit();
    }
};
exports.BoNhoDemXuLy = BoNhoDemXuLy;
exports.BoNhoDemXuLy = BoNhoDemXuLy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BoNhoDemXuLy);
//# sourceMappingURL=bo-nho-dem.xu-ly.js.map
