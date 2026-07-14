import { ThongKeXuLy } from './thong-ke.xu-ly';
export declare class ThongKeDieuKhien {
    private ThongKeXuLy;
    constructor(ThongKeXuLy: ThongKeXuLy);
    getSummary(): Promise<{
        devices_online: number;
        total_devices: number;
        alerts_today: number;
        pending_urgent: number;
        avg_response_minutes: number;
    }>;
    getByType(): Promise<{
        sound_type: import(".prisma/client").$Enums.SoundType;
        count: number;
    }[]>;
    getByArea(): Promise<{
        area: string;
        count: number;
    }[]>;
    getTrend(period: string): Promise<{
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
    getRatio(): Promise<{
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
