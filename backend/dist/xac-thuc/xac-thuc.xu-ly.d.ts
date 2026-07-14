import { JwtService } from '@nestjs/jwt';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
export declare class XacThucXuLy {
    private prisma;
    private jwtService;
    constructor(prisma: CoSoDuLieuXuLy, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            full_name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
}
