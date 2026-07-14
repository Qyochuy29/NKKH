import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoNhoDemXuLy } from '../bo-nho-dem/bo-nho-dem.xu-ly';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws/alerts',
})
export class CanhBaoCongKetNoi implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('CanhBaoCongKetNoi');

  constructor(private redis: BoNhoDemXuLy) { }

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to Redis channels and broadcast to WebSocket clients
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

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}

