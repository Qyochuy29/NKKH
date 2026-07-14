import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
export declare class ThongKeXuLy {
    private prisma;
    constructor(prisma: CoSoDuLieuXuLy);
    getSummary(): Promise<{
        devices_online: number;
        total_devices: number;
        alerts_today: number;
        pending_urgent: number;
        avg_response_minutes: number;
    }>;
    private getAvgResponseTime;
    getByType(): Promise<{
        sound_type: import(".prisma/client").$Enums.SoundType;
        count: number;
    }[]>;
    getByArea(): Promise<{
        area: string;
        count: number;
    }[]>;
    getTrend(period?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getHeatmap(): Promise<{
        area: string;
        hours: {
            hour: number;
            count: number;
        }[];
    }[]>;
    getAlertRatio(): Promise<{
        confirmed: number;
        false_alarm: number;
        pending: number;
        total: number;
    }>;
    getHourlyToday(): Promise<{
        hour: number;
        count: number;
    }[]>;
}
