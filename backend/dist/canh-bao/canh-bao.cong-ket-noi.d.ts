import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoNhoDemXuLy } from '../bo-nho-dem/bo-nho-dem.xu-ly';
export declare class CanhBaoCongKetNoi implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private redis;
    server: Server;
    private logger;
    constructor(redis: BoNhoDemXuLy);
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
}
