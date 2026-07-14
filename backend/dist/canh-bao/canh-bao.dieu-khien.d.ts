import { CanhBaoXuLy } from './canh-bao.xu-ly';
import { TaoCanhBaoDto, CapNhatCanhBaoDto, TruyVanCanhBaoDto } from './du-lieu-vao/canh-bao.dto';
export declare class CanhBaoDieuKhien {
    private CanhBaoXuLy;
    constructor(CanhBaoXuLy: CanhBaoXuLy);
    findAll(query: TruyVanCanhBaoDto, req: any): Promise<{
        data: {
            device: {
                id: string;
                name: string;
                area: string;
                floor: number;
            };
            handled_by: {
                id: string;
                full_name: string;
            } | null;
            id: string;
            status: import(".prisma/client").$Enums.AlertStatus;
            device_id: string;
            timestamp: Date;
            sound_type: import(".prisma/client").$Enums.SoundType;
            confidence_score: number;
            handled_by_id: string | null;
            resolved_at: Date | null;
            notes: string | null;
            is_evidence: boolean;
        }[];
        total: number;
        offset: number;
        limit: number;
    }>;
    findOne(id: string, req: any): Promise<{
        device: {
            id: string;
            name: string;
            area: string;
            floor: number;
            position_x: number;
            position_y: number;
            status: import(".prisma/client").$Enums.DeviceStatus;
            battery_level: number;
            last_seen: Date;
        };
        handled_by: {
            id: string;
            full_name: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
        logs: ({
            actor: {
                id: string;
                full_name: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            timestamp: Date;
            alert_id: string;
            action: string;
            actor_id: string;
        })[];
        id: string;
        status: import(".prisma/client").$Enums.AlertStatus;
        device_id: string;
        timestamp: Date;
        sound_type: import(".prisma/client").$Enums.SoundType;
        confidence_score: number;
        handled_by_id: string | null;
        resolved_at: Date | null;
        notes: string | null;
        is_evidence: boolean;
    } | null>;
    create(dto: TaoCanhBaoDto): Promise<{
        device: {
            id: string;
            name: string;
            area: string;
            floor: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AlertStatus;
        device_id: string;
        timestamp: Date;
        sound_type: import(".prisma/client").$Enums.SoundType;
        confidence_score: number;
        audio_file_url: string | null;
        handled_by_id: string | null;
        resolved_at: Date | null;
        notes: string | null;
        is_evidence: boolean;
    }>;
    uploadAudio(file: Express.Multer.File, req: any): Promise<({
        device: {
            id: string;
            name: string;
            area: string;
            floor: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AlertStatus;
        device_id: string;
        timestamp: Date;
        sound_type: import(".prisma/client").$Enums.SoundType;
        confidence_score: number;
        audio_file_url: string | null;
        handled_by_id: string | null;
        resolved_at: Date | null;
        notes: string | null;
        is_evidence: boolean;
    }) | {
        error: string;
    }>;
    update(id: string, dto: CapNhatCanhBaoDto, req: any): Promise<{
        device: {
            id: string;
            name: string;
            area: string;
            floor: number;
        };
        handled_by: {
            id: string;
            full_name: string;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AlertStatus;
        device_id: string;
        timestamp: Date;
        sound_type: import(".prisma/client").$Enums.SoundType;
        confidence_score: number;
        audio_file_url: string | null;
        handled_by_id: string | null;
        resolved_at: Date | null;
        notes: string | null;
        is_evidence: boolean;
    }>;
}
