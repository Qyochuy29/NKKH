import { XacThucXuLy } from './xac-thuc.xu-ly';
import { DangNhapDto, LamMoiDto } from './du-lieu-vao/xac-thuc.dto';
export declare class XacThucDieuKhien {
    private XacThucXuLy;
    constructor(XacThucXuLy: XacThucXuLy);
    login(dto: DangNhapDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            full_name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    refresh(dto: LamMoiDto): Promise<{
        access_token: string;
    }>;
    me(req: any): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
}
