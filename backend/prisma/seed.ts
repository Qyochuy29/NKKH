import { PrismaClient, Role, DeviceStatus, SoundType, AlertStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if already seeded
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database...');

  // --- Users ---
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        full_name: 'Nguyễn Văn Admin',
        email: 'admin@gmail.com',
        password_hash: passwordHash,
        role: Role.admin,
      },
    }),
    prisma.user.create({
      data: {
        full_name: 'Trần Thị Hiệu Trưởng',
        email: 'bgh@gmail.com',
        password_hash: passwordHash,
        role: Role.ban_giam_hieu,
      },
    }),
    prisma.user.create({
      data: {
        full_name: 'Lê Văn Giám Thị',
        email: 'giamthi@gmail.com',
        password_hash: passwordHash,
        role: Role.giam_thi,
      },
    }),
    prisma.user.create({
      data: {
        full_name: 'Phạm Minh Bảo Vệ',
        email: 'baove@gmail.com',
        password_hash: passwordHash,
        role: Role.bao_ve,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // --- Devices ---
  const areas = [
    // Floor 1
    { name: 'Sân trường chính', area: 'Sân trường', floor: 1 },
    { name: 'Cổng trường', area: 'Cổng trường', floor: 1 },
    { name: 'Nhà xe học sinh', area: 'Nhà xe', floor: 1 },
    { name: 'Canteen A', area: 'Canteen', floor: 1 },
    { name: 'Canteen B', area: 'Canteen', floor: 1 },
    { name: 'Hành lang tầng 1 - A', area: 'Hành lang T1', floor: 1 },
    { name: 'Hành lang tầng 1 - B', area: 'Hành lang T1', floor: 1 },
    { name: 'Phòng học 101', area: 'Phòng học T1', floor: 1 },
    { name: 'Phòng học 102', area: 'Phòng học T1', floor: 1 },
    { name: 'Phòng học 103', area: 'Phòng học T1', floor: 1 },
    { name: 'Phòng học 104', area: 'Phòng học T1', floor: 1 },
    { name: 'Phòng học 105', area: 'Phòng học T1', floor: 1 },
    { name: 'Nhà vệ sinh T1 Nam', area: 'Nhà vệ sinh T1', floor: 1 },
    { name: 'Nhà vệ sinh T1 Nữ', area: 'Nhà vệ sinh T1', floor: 1 },
    { name: 'Phòng bảo vệ', area: 'Phòng bảo vệ', floor: 1 },
    // Floor 2
    { name: 'Hành lang tầng 2 - A', area: 'Hành lang T2', floor: 2 },
    { name: 'Hành lang tầng 2 - B', area: 'Hành lang T2', floor: 2 },
    { name: 'Phòng học 201', area: 'Phòng học T2', floor: 2 },
    { name: 'Phòng học 202', area: 'Phòng học T2', floor: 2 },
    { name: 'Phòng học 203', area: 'Phòng học T2', floor: 2 },
    { name: 'Phòng học 204', area: 'Phòng học T2', floor: 2 },
    { name: 'Phòng học 205', area: 'Phòng học T2', floor: 2 },
    { name: 'Phòng học 206', area: 'Phòng học T2', floor: 2 },
    { name: 'Phòng thí nghiệm', area: 'Phòng TN', floor: 2 },
    { name: 'Thư viện', area: 'Thư viện', floor: 2 },
    { name: 'Nhà vệ sinh T2 Nam', area: 'Nhà vệ sinh T2', floor: 2 },
    { name: 'Nhà vệ sinh T2 Nữ', area: 'Nhà vệ sinh T2', floor: 2 },
    { name: 'Phòng giáo viên', area: 'Phòng GV', floor: 2 },
    { name: 'Cầu thang T2-A', area: 'Cầu thang', floor: 2 },
    { name: 'Cầu thang T2-B', area: 'Cầu thang', floor: 2 },
    // Floor 3
    { name: 'Hành lang tầng 3 - A', area: 'Hành lang T3', floor: 3 },
    { name: 'Hành lang tầng 3 - B', area: 'Hành lang T3', floor: 3 },
    { name: 'Phòng học 301', area: 'Phòng học T3', floor: 3 },
    { name: 'Phòng học 302', area: 'Phòng học T3', floor: 3 },
    { name: 'Phòng học 303', area: 'Phòng học T3', floor: 3 },
    { name: 'Phòng học 304', area: 'Phòng học T3', floor: 3 },
    { name: 'Phòng học 305', area: 'Phòng học T3', floor: 3 },
    { name: 'Phòng tin học', area: 'Phòng tin học', floor: 3 },
    { name: 'Phòng nhạc', area: 'Phòng nhạc', floor: 3 },
    { name: 'Nhà vệ sinh T3 Nam', area: 'Nhà vệ sinh T3', floor: 3 },
    { name: 'Nhà vệ sinh T3 Nữ', area: 'Nhà vệ sinh T3', floor: 3 },
    { name: 'Sân thượng', area: 'Sân thượng', floor: 3 },
    { name: 'Cầu thang T3-A', area: 'Cầu thang', floor: 3 },
    { name: 'Cầu thang T3-B', area: 'Cầu thang', floor: 3 },
    { name: 'Phòng họp lớn', area: 'Phòng họp', floor: 3 },
  ];

  const devices: any[] = [];
  for (let i = 0; i < areas.length; i++) {
    const a = areas[i];
    const statusOptions: DeviceStatus[] = [DeviceStatus.online, DeviceStatus.online, DeviceStatus.online, DeviceStatus.offline, DeviceStatus.error];
    const device = await prisma.device.create({
      data: {
        name: `MIC-${String(i + 1).padStart(3, '0')}`,
        area: a.area,
        floor: a.floor,
        position_x: 5 + Math.random() * 90,
        position_y: 5 + Math.random() * 90,
        status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        battery_level: 20 + Math.floor(Math.random() * 80),
        last_seen: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
      },
    });
    devices.push(device);
  }

  console.log(`✅ Created ${devices.length} devices`);

  // --- Historical Alerts ---
  const soundTypes: SoundType[] = [SoundType.scream, SoundType.help, SoundType.threat, SoundType.argument];
  const alertStatuses: AlertStatus[] = [AlertStatus.pending, AlertStatus.confirmed, AlertStatus.false_alarm, AlertStatus.resolved];
  const handlerUsers = users.filter(u => u.role !== Role.admin);

  const alerts: any[] = [];
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const timestamp = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 - minutesAgo * 60000);

    const status = alertStatuses[Math.floor(Math.random() * alertStatuses.length)];
    const isHandled = status !== AlertStatus.pending;
    const handler = isHandled ? handlerUsers[Math.floor(Math.random() * handlerUsers.length)] : null;

    const device = devices[Math.floor(Math.random() * devices.length)];
    const soundType = soundTypes[Math.floor(Math.random() * soundTypes.length)];

    const alert = await prisma.alert.create({
      data: {
        device_id: device.id,
        timestamp,
        sound_type: soundType,
        confidence_score: 60 + Math.random() * 39,
        audio_file_url: `/assets/demo-audio-${soundType}.mp3`,
        status,
        handled_by_id: handler?.id || null,
        resolved_at: isHandled ? new Date(timestamp.getTime() + Math.floor(Math.random() * 1800000)) : null,
        notes: isHandled ? getRandomNote(status) : null,
        is_evidence: status === AlertStatus.confirmed && Math.random() > 0.5,
      },
    });
    alerts.push(alert);

    // Create alert logs for handled alerts
    if (isHandled && handler) {
      await prisma.alertLog.create({
        data: {
          alert_id: alert.id,
          action: getActionForStatus(status),
          actor_id: handler.id,
          timestamp: alert.resolved_at || new Date(timestamp.getTime() + 300000),
        },
      });
    }
  }

  console.log(`✅ Created ${alerts.length} alerts with logs`);

  // --- Settings ---
  await prisma.setting.createMany({
    data: [
      { key: 'min_confidence_threshold', value: '70' },
      { key: 'monitor_scream', value: 'true' },
      { key: 'monitor_help', value: 'true' },
      { key: 'monitor_threat', value: 'true' },
      { key: 'monitor_argument', value: 'true' },
      { key: 'audio_retention_days', value: '30' },
    ],
  });

  console.log('✅ Created default settings');
  console.log('🎉 Seeding completed!');
}

function getRandomNote(status: AlertStatus): string {
  const notes: Record<string, string[]> = {
    confirmed: [
      'Xác nhận có xảy ra xô xát giữa hai học sinh lớp 9.',
      'Phát hiện nhóm học sinh đang ẩu đả tại khu vực sân trường.',
      'Đã xác nhận sự việc, đã thông báo ban giám hiệu.',
      'Học sinh bị bắt nạt, đã can thiệp kịp thời.',
    ],
    false_alarm: [
      'Âm thanh từ hoạt động thể dục buổi sáng.',
      'Tiếng ồn từ lớp học nhạc.',
      'Học sinh đùa giỡn bình thường.',
      'Âm thanh từ sân thể dục.',
    ],
    resolved: [
      'Đã xử lý xong, báo cáo ban giám hiệu.',
      'Đã mời phụ huynh làm việc.',
      'Tình huống đã được giải quyết ổn thỏa.',
      'Đã lập biên bản và thông báo giáo viên chủ nhiệm.',
    ],
  };

  const statusKey = status === AlertStatus.confirmed ? 'confirmed' :
                    status === AlertStatus.false_alarm ? 'false_alarm' : 'resolved';
  const options = notes[statusKey] || notes.resolved;
  return options[Math.floor(Math.random() * options.length)];
}

function getActionForStatus(status: AlertStatus): string {
  switch (status) {
    case AlertStatus.confirmed: return 'Xác nhận sự cố';
    case AlertStatus.false_alarm: return 'Đánh dấu báo động giả';
    case AlertStatus.resolved: return 'Đã xử lý xong';
    default: return 'Cập nhật trạng thái';
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
