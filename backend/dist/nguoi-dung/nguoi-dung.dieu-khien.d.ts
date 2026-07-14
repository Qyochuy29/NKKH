import { NguoiDungXuLy } from './nguoi-dung.xu-ly';
import { TaoNguoiDungDto, CapNhatNguoiDungDto } from './du-lieu-vao/nguoi-dung.dto';
export declare class NguoiDungDieuKhien {
    private NguoiDungXuLy;
    constructor(NguoiDungXuLy: NguoiDungXuLy);
    findAll(): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }[]>;
    create(dto: TaoNguoiDungDto): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
    update(id: string, dto: CapNhatNguoiDungDto): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: import(".prisma/client").$Enums.Role;
        created_at: Date;
    }>;
}
