import { CaiDatXuLy } from './cai-dat.xu-ly';
export declare class CaiDatDieuKhien {
    private CaiDatXuLy;
    constructor(CaiDatXuLy: CaiDatXuLy);
    findAll(): Promise<Record<string, string>>;
    update(body: {
        settings: {
            key: string;
            value: string;
        }[];
    }): Promise<{
        key: string;
        value: string;
    }[]>;
}
