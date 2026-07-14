import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
export declare class CaiDatXuLy {
    private prisma;
    constructor(prisma: CoSoDuLieuXuLy);
    findAll(): Promise<Record<string, string>>;
    get(key: string): Promise<string | null>;
    updateMany(settings: {
        key: string;
        value: string;
    }[]): Promise<{
        key: string;
        value: string;
    }[]>;
}
