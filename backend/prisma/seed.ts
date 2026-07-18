import { PrismaClient, Role, DeviceStatus, SoundType, AlertStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check removed to force seed

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

  // --- Areas ---
  const areaNames = [
    'Sân trường',
    'Cổng trường chính',
    'Khu vực tập thể dục',
    'Canteen',
    'Hành lang T1',
    'Lớp 1A1',
    'Lớp 1A2',
    'Nhà vệ sinh T1',
    'Phòng bảo vệ',
    'Hành lang T2',
    'Lớp 2A1',
    'Lớp 2A2',
    'Nhà vệ sinh T2',
    'Phòng giáo viên',
    'Thư viện',
    'Phòng y tế',
    'Cầu thang',
    'Hành lang T3',
    'Lớp 3A1',
    'Lớp 4A1',
    'Lớp 5A1',
    'Nhà vệ sinh T3',
    'Phòng tin học',
    'Phòng âm nhạc',
  ];

  const areaRecords = await Promise.all(
    areaNames.map(name => prisma.area.create({ data: { name } }))
  );
  const areaMap = Object.fromEntries(areaRecords.map(a => [a.name, a.id]));

  console.log(`✅ Created ${areaRecords.length} areas`);

  // --- Devices ---
  const deviceList = [
    // Floor 1
    { name: 'Khu vực Sân trường', area: 'Sân trường', floor: 1 },
    { name: 'Cổng trường chính', area: 'Cổng trường chính', floor: 1 },
    { name: 'Sân tập thể dục', area: 'Khu vực tập thể dục', floor: 1 },
    { name: 'Canteen', area: 'Canteen', floor: 1 },
    { name: 'Hành lang tầng 1 - A', area: 'Hành lang T1', floor: 1 },
    { name: 'Lớp 1A1', area: 'Lớp 1A1', floor: 1 },
    { name: 'Lớp 1A2', area: 'Lớp 1A2', floor: 1 },
    { name: 'Nhà vệ sinh T1', area: 'Nhà vệ sinh T1', floor: 1 },
    { name: 'Phòng bảo vệ', area: 'Phòng bảo vệ', floor: 1 },
    { name: 'Phòng y tế', area: 'Phòng y tế', floor: 1 },
    // Floor 2
    { name: 'Hành lang tầng 2 - A', area: 'Hành lang T2', floor: 2 },
    { name: 'Lớp 2A1', area: 'Lớp 2A1', floor: 2 },
    { name: 'Lớp 2A2', area: 'Lớp 2A2', floor: 2 },
    { name: 'Thư viện trường', area: 'Thư viện', floor: 2 },
    { name: 'Nhà vệ sinh T2', area: 'Nhà vệ sinh T2', floor: 2 },
    { name: 'Phòng giáo viên', area: 'Phòng giáo viên', floor: 2 },
    { name: 'Cầu thang T2', area: 'Cầu thang', floor: 2 },
    // Floor 3
    { name: 'Hành lang tầng 3 - A', area: 'Hành lang T3', floor: 3 },
    { name: 'Lớp 3A1', area: 'Lớp 3A1', floor: 3 },
    { name: 'Lớp 4A1', area: 'Lớp 4A1', floor: 3 },
    { name: 'Lớp 5A1', area: 'Lớp 5A1', floor: 3 },
    { name: 'Phòng tin học', area: 'Phòng tin học', floor: 3 },
    { name: 'Phòng âm nhạc', area: 'Phòng âm nhạc', floor: 3 },
    { name: 'Nhà vệ sinh T3', area: 'Nhà vệ sinh T3', floor: 3 },
    { name: 'Cầu thang T3', area: 'Cầu thang', floor: 3 },
  ];

  const devices: any[] = [];
  for (let i = 0; i < deviceList.length; i++) {
    const a = deviceList[i];
    const statusOptions: DeviceStatus[] = [DeviceStatus.online, DeviceStatus.online, DeviceStatus.online, DeviceStatus.offline, DeviceStatus.error];
    const device = await prisma.device.create({
      data: {
        name: `MIC-${String(i + 1).padStart(3, '0')}`,
        area_id: areaMap[a.area],
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
      { key: 'simulator_enabled', value: 'true' },
    ],
  });

  console.log('✅ Created default settings');
  console.log('🎉 Seeding completed!');
}

function getRandomNote(status: AlertStatus): string {
  const notes: Record<string, string[]> = {
    confirmed: [
      'Xác nhận có học sinh cãi nhau lớn tiếng do mâu thuẫn lúc xếp hàng.',
      'Phát hiện học sinh lớp 1 chạy nhảy bị ngã trầy xước ở sân trường.',
      'Giám thị báo cáo có nhóm học sinh lớp 5 đuổi đánh nhau ở hành lang.',
      'Phát hiện tiếng to tiếng nghi là phụ huynh phàn nàn ở phòng bảo vệ.',
    ],
    false_alarm: [
      'Tiếng ồn reo hò trong tiết học thể dục ngoài sân.',
      'Học sinh nô đùa, hò hét bình thường trong giờ ra chơi.',
      'Âm thanh tập hát đồng thanh của lớp 3A1.',
      'Tiếng la hét vui vẻ khi chơi đuổi bắt ở sân trường.',
    ],
    resolved: [
      'Giáo viên chủ nhiệm đã can thiệp, yêu cầu các em xin lỗi nhau.',
      'Đã đưa học sinh xuống phòng y tế băng bó vết thương nhẹ.',
      'Đã nhắc nhở các em đi đứng cẩn thận không chạy nhảy trên hành lang.',
      'Đã mời phụ huynh vào phòng tiếp khách để giải thích rõ ràng.',
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
