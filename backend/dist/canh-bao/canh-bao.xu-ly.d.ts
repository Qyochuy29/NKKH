import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
import { BoNhoDemXuLy } from '../bo-nho-dem/bo-nho-dem.xu-ly';
export declare class CanhBaoXuLy {
    private prisma;
    private redis;
    private readonly logger;
    constructor(prisma: CoSoDuLieuXuLy, redis: BoNhoDemXuLy);
    findAll(query: {
        date_from?: string;
        date_to?: string;
        area?: string;
        sound_type?: string;
        status?: string;
        offset?: number;
        limit?: number;
    }, userRole?: string): Promise<{
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
    findOne(id: string, userRole?: string): Promise<{
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
    submitDetection(deviceId: string, soundType: string, confidence: number, audioUrl?: string, notes?: string): Promise<{
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
    analyzeUploadedAudio(audioUrl: string, originalName?: string): Promise<{
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
    updateAlert(id: string, data: {
        status?: string;
        notes?: string;
        is_evidence?: boolean;
    }, userId: string): Promise<{
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
    getPendingCount(): Promise<number>;
    cleanupOldAudio(): Promise<void>;
}
