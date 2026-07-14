import { OnModuleInit } from '@nestjs/common';
import { CanhBaoXuLy } from '../canh-bao/canh-bao.xu-ly';
import { ThietBiXuLy } from '../thiet-bi/thiet-bi.xu-ly';
export declare class AiGiaLapXuLy implements OnModuleInit {
    private CanhBaoXuLy;
    private ThietBiXuLy;
    private readonly logger;
    private intervalRef;
    constructor(CanhBaoXuLy: CanhBaoXuLy, ThietBiXuLy: ThietBiXuLy);
    onModuleInit(): void;
    private scheduleNext;
    generateAlert(): Promise<({
        device: {
            area: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
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
    }) | undefined>;
    submitDetection(deviceId: string, soundType: string, confidence: number, audioUrl?: string): Promise<{
        device: {
            area: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
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
}
