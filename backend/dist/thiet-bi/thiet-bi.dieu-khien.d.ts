import { ThietBiXuLy } from './thiet-bi.xu-ly';
import { TaoThietBiDto, CapNhatThietBiDto } from './du-lieu-vao/thiet-bi.dto';
export declare class ThietBiDieuKhien {
    private ThietBiXuLy;
    constructor(ThietBiXuLy: ThietBiXuLy);
    findAll(): Promise<{
        id: string;
        name: string;
        area: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    }[]>;
    create(dto: TaoThietBiDto): Promise<{
        id: string;
        name: string;
        area: string;
        floor: number;
        position_x: number;
        position_y: number;
        status: import(".prisma/client").$Enums.DeviceStatus;
        battery_level: number;
        last_seen: Date;
    }>;
    update(id: string, dto: CapNhatThietBiDto): Promise<{
        id: string;
        name: string;
        area: string;
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
}
