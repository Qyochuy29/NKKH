import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
export declare class NguoiDungXuLy {
    private prisma;
    constructor(prisma: CoSoDuLieuXuLy);
    findAll(): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }[]>;
    create(data: {
        full_name: string;
        email: string;
        password: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
    update(id: string, data: {
        full_name?: string;
        email?: string;
        password?: string;
        role?: string;
    }): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        full_name: string;
        password_hash: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
}
