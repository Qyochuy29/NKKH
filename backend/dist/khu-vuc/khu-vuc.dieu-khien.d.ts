import { KhuVucXuLy } from './khu-vuc.xu-ly';
import { TaoKhuVucDto, CapNhatKhuVucDto } from './du-lieu-vao/khu-vuc.dto';
export declare class KhuVucDieuKhien {
    private khuVucXuLy;
    constructor(khuVucXuLy: KhuVucXuLy);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string | null;
        created_at: Date;
        device_count: number;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            devices: number;
        };
        devices: {
            id: string;
            name: string;
            floor: number;
            status: import(".prisma/client").$Enums.DeviceStatus;
        }[];
    } & {
        id: string;
        created_at: Date;
        name: string;
        description: string | null;
    }>;
    create(dto: TaoKhuVucDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        description: string | null;
    }>;
    update(id: string, dto: CapNhatKhuVucDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        description: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        description: string | null;
    }>;
}
