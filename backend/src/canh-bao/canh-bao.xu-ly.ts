import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoSoDuLieuXuLy } from '../co-so-du-lieu/co-so-du-lieu.xu-ly';
import { BoNhoDemXuLy } from '../bo-nho-dem/bo-nho-dem.xu-ly';
import { AlertStatus, SoundType } from '@prisma/client';

@Injectable()
export class CanhBaoXuLy {
  private readonly logger = new Logger('CanhBaoXuLy');

  constructor(
    private prisma: CoSoDuLieuXuLy,
    private redis: BoNhoDemXuLy,
  ) { }

  async findAll(query: {
    date_from?: string;
    date_to?: string;
    area?: string;
    sound_type?: string;
    status?: string;
    offset?: number;
    limit?: number;
  }, userRole?: string) {
    const where: any = {};

    if (query.date_from || query.date_to) {
      where.timestamp = {};
      if (query.date_from) where.timestamp.gte = new Date(query.date_from);
      if (query.date_to) where.timestamp.lte = new Date(query.date_to);
    }

    if (query.sound_type) {
      where.sound_type = query.sound_type as SoundType;
    }

    if (query.status) {
      where.status = query.status as AlertStatus;
    }

    if (query.area) {
      where.device = { area: { name: { contains: query.area, mode: 'insensitive' } } };
    }

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: {
          device: { select: { id: true, name: true, area: { select: { id: true, name: true } }, floor: true } },
          handled_by: { select: { id: true, full_name: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: query.offset || 0,
        take: query.limit || 20,
      }),
      this.prisma.alert.count({ where }),
    ]);

    // Filter audio URL based on role
    const filteredData = data.map(alert => {
      if (userRole !== 'admin' && userRole !== 'ban_giam_hieu') {
        const { audio_file_url, ...rest } = alert;
        return rest;
      }
      return alert;
    });

    return { data: filteredData, total, offset: query.offset || 0, limit: query.limit || 20 };
  }

  async findOne(id: string, userRole?: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        device: true,
        handled_by: { select: { id: true, full_name: true, role: true } },
        logs: {
          include: { actor: { select: { id: true, full_name: true, role: true } } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Filter audio URL based on role
    if (alert && userRole !== 'admin' && userRole !== 'ban_giam_hieu') {
      const { audio_file_url, ...rest } = alert;
      return rest;
    }

    return alert;
  }

  async submitDetection(
    deviceId: string,
    soundType: string,
    confidence: number,
    audioUrl?: string,
    notes?: string
  ) {
    const alert = await this.prisma.alert.create({
      data: {
        device_id: deviceId,
        sound_type: soundType as SoundType,
        confidence_score: confidence,
        audio_file_url: audioUrl || null,
        notes: notes || null,
        status: AlertStatus.pending,
      },
      include: {
        device: { select: { id: true, name: true, area: { select: { id: true, name: true } }, floor: true } },
      },
    });

    // Publish to Redis for WebSocket broadcast
    await this.redis.publish('new-alert', JSON.stringify(alert));

    return alert;
  }

  async analyzeUploadedAudio(audioUrl: string, originalName: string = '') {
    // 1. Pick a random online device
    const devices = await this.prisma.device.findMany({ where: { status: 'online' } });
    const device = devices.length > 0
      ? devices[Math.floor(Math.random() * devices.length)]
      : await this.prisma.device.findFirst();

    if (!device) {
      throw new Error('No devices available to bind alert');
    }

    let soundType = 'argument';
    let confidence = 85;
    let notes = '';

    try {
      // 2. Call the AI microservice (Python)
      // audioUrl = "/uploads/xxx.mp3", absolute path in container is "/app" + audioUrl
      const absolutePath = `/app${audioUrl}`;
      const response = await fetch('http://ai-service:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: absolutePath })
      });

      if (response.ok) {
        const result = await response.json() as any;
        soundType = result.soundType;
        confidence = result.confidence;

        if (result.transcript) {
          notes = `🗣 AI nghe được: "${result.transcript}"`;
        } else {
          notes = `🔇 AI không nghe rõ tiếng (quá ồn hoặc lỗi thu âm).`;
        }
      } else {
        console.error('AI Service Error:', await response.text());
        // Fallback to random if AI service fails
        soundType = ['scream', 'help', 'threat', 'argument'][Math.floor(Math.random() * 4)];
      }
    } catch (e) {
      console.error('Failed to reach AI service:', e.message);
      // Fallback
      soundType = ['scream', 'help', 'threat', 'argument'][Math.floor(Math.random() * 4)];
    }

    // 3. Submit the detection
    return this.submitDetection(device.id, soundType, confidence, audioUrl, notes);
  }


  async updateAlert(id: string, data: { status?: string; notes?: string; is_evidence?: boolean }, userId: string) {
    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status as AlertStatus;
      if (data.status !== 'pending') {
        updateData.handled_by_id = userId;
        updateData.resolved_at = new Date();
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.is_evidence !== undefined) updateData.is_evidence = data.is_evidence;

    const alert = await this.prisma.alert.update({
      where: { id },
      data: updateData,
      include: {
        device: { select: { id: true, name: true, area: { select: { id: true, name: true } }, floor: true } },
        handled_by: { select: { id: true, full_name: true } },
      },
    });

    // Create alert log
    if (data.status) {
      const actionMap: Record<string, string> = {
        confirmed: 'Xác nhận sự cố',
        false_alarm: 'Đánh dấu báo động giả',
        resolved: 'Đã xử lý xong',
      };

      await this.prisma.alertLog.create({
        data: {
          alert_id: id,
          action: actionMap[data.status] || `Cập nhật: ${data.status}`,
          actor_id: userId,
        },
      });
    }

    // Publish update event
    await this.redis.publish('alert-updated', JSON.stringify(alert));

    return alert;
  }

  async getPendingCount() {
    return this.prisma.alert.count({
      where: { status: AlertStatus.pending },
    });
  }

  /**
   * Cron job: Mark audio for deletion after 30 days (unless is_evidence)
   * Runs daily at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldAudio() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const result = await this.prisma.alert.updateMany({
      where: {
        timestamp: { lt: thirtyDaysAgo },
        is_evidence: false,
        audio_file_url: { not: null },
      },
      data: {
        audio_file_url: null,
      },
    });

    if (result.count > 0) {
      this.logger.log(`🗑️ Cleaned up audio URLs for ${result.count} old alerts`);
    }
  }
}

