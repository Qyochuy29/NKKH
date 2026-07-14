import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CanhBaoXuLy } from '../canh-bao/canh-bao.xu-ly';
import { ThietBiXuLy } from '../thiet-bi/thiet-bi.xu-ly';

@Injectable()
export class AiGiaLapXuLy implements OnModuleInit {
  private readonly logger = new Logger('AiGiaLapXuLy');
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(
    private CanhBaoXuLy: CanhBaoXuLy,
    private ThietBiXuLy: ThietBiXuLy,
  ) {}

  onModuleInit() {
    const enabled = process.env.MOCK_AI_ENABLED !== 'false';
    if (enabled) {
      this.logger.log('🤖 Mock AI Service started — generating simulated alerts');
      this.scheduleNext();
    }
  }

  private scheduleNext() {
    const minInterval = parseInt(process.env.MOCK_AI_INTERVAL_MIN || '15000', 10);
    const maxInterval = parseInt(process.env.MOCK_AI_INTERVAL_MAX || '40000', 10);
    const delay = minInterval + Math.floor(Math.random() * (maxInterval - minInterval));

    this.intervalRef = setTimeout(async () => {
      await this.generateAlert();
      this.scheduleNext();
    }, delay);
  }

  async generateAlert() {
    try {
      const devices = await this.ThietBiXuLy.getOnlineDevices();
      if (devices.length === 0) {
        this.logger.warn('No online devices available for mock alert');
        return;
      }

      const device = devices[Math.floor(Math.random() * devices.length)];
      const soundTypes = ['scream', 'help', 'threat', 'argument'];
      const soundType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
      const confidence = 60 + Math.random() * 39;

      const soundTypeLabels: Record<string, string> = {
        scream: 'La hét',
        help: 'Kêu cứu',
        threat: 'Đe dọa',
        argument: 'Cãi vã',
      };

      const alert = await this.submitDetection(
        device.id,
        soundType,
        parseFloat(confidence.toFixed(1)),
        `/assets/demo-audio-${soundType}.mp3`,
      );

      this.logger.log(
        `⚠️ Mock alert generated: ${soundTypeLabels[soundType]} (${confidence.toFixed(1)}%) at ${device.area} [${device.name}]`,
      );

      return alert;
    } catch (error) {
      this.logger.error('Failed to generate mock alert:', error);
    }
  }

  /**
   * Interface method: submitDetection
   * This is the same interface that a real AI model (e.g., ONNX inference) would use.
   * To replace mock with real AI, simply swap this service's implementation
   * to load and run an ONNX model via onnxruntime-node.
   */
  async submitDetection(
    deviceId: string,
    soundType: string,
    confidence: number,
    audioUrl?: string,
  ) {
    return this.CanhBaoXuLy.submitDetection(deviceId, soundType, confidence, audioUrl);
  }
}

