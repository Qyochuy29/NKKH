export declare class TaoCanhBaoDto {
    device_id: string;
    sound_type: string;
    confidence_score: number;
    audio_file_url?: string;
}
export declare class CapNhatCanhBaoDto {
    status?: string;
    notes?: string;
    is_evidence?: boolean;
}
export declare class TruyVanCanhBaoDto {
    date_from?: string;
    date_to?: string;
    area?: string;
    sound_type?: string;
    status?: string;
    offset?: number;
    limit?: number;
}
