import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
export declare class KhuVucXuLy {
    private prisma;
    constructor(prisma: CoSoDuLieuXuLy);
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
    create(data: {
        name: string;
        description?: string;
    }): Promise<{
        id: string;
        created_at: Date;
        name: string;
        description: string | null;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
    }): Promise<{
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
