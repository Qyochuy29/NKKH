import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare class BoNhoDemXuLy implements OnModuleDestroy {
    private readonly client;
    private readonly subscriber;
    private readonly handlers;
    private listenerRegistered;
    constructor();
    getClient(): Redis;
    publish(channel: string, message: string): Promise<void>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
