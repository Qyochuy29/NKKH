import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BoNhoDemXuLy implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly handlers = new Map<string, (msg: string) => void>();
  private listenerRegistered = false;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url);
    this.subscriber = new Redis(url);
  }

  getClient(): Redis {
    return this.client;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.handlers.set(channel, callback);
    await this.subscriber.subscribe(channel);

    // Only register the global message listener once
    if (!this.listenerRegistered) {
      this.listenerRegistered = true;
      this.subscriber.on('message', (ch, msg) => {
        const handler = this.handlers.get(ch);
        if (handler) handler(msg);
      });
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
  }
}

