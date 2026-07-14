import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
export declare class ThietBiXuLy {
    private prisma;
    constructor(prisma: CoSoDuLieuXuLy);
    findAll(): Promise<({
        area: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        area_id: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    })[]>;
    findOne(id: string): Promise<({
        area: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        area_id: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    }) | null>;
    create(data: {
        name: string;
        area_id: string;
        floor: number;
        position_x: number;
        position_y: number;
    }): Promise<{
        area: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        area_id: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    }>;
    update(id: string, data: any): Promise<{
        area: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        area_id: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    }>;
    getStatus(id: string): Promise<{
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    } | null>;
    getOnlineDevices(): Promise<({
        area: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        area_id: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    })[]>;
}
