using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Services
{
    public class SimulatorBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SimulatorBackgroundService> _logger;
        private readonly Random _rand = new Random();

        public SimulatorBackgroundService(IServiceScopeFactory scopeFactory, ILogger<SimulatorBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SimulatorBackgroundService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                // Đợi 15-40 giây trước mỗi lần giả lập (để demo nhanh)
                int waitSeconds = _rand.Next(15, 41);
                await Task.Delay(TimeSpan.FromSeconds(waitSeconds), stoppingToken);

                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var alertsService = scope.ServiceProvider.GetRequiredService<AlertsService>();

                        // Lấy cấu hình bật tắt giả lập
                        var setting = await db.Settings.FirstOrDefaultAsync(s => s.Key == AppConstants.SettingKeys.SimulatorEnabled, stoppingToken);
                        if (setting == null || setting.Value != "true") continue;

                        var devices = await db.Devices.ToListAsync(stoppingToken);
                        if (!devices.Any()) continue;

                        // Lấy thiết bị ngẫu nhiên
                        var randomDevice = devices[_rand.Next(devices.Count)];

                        // Random loại âm thanh
                        var soundTypes = Enum.GetValues<SoundType>();
                        var randomSoundType = soundTypes[_rand.Next(soundTypes.Length)];

                        // Random độ tin cậy (60% - 99%)
                        var confidence = _rand.Next(60, 100);

                        _logger.LogInformation($"[Giả lập] Tạo cảnh báo cho thiết bị {randomDevice.Name}: {randomSoundType} ({confidence}%)");

                        string? randomAudioUrl = null;
                        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                        _logger.LogInformation($"[Giả lập] Uploads path is {uploadsPath}, Exists: {Directory.Exists(uploadsPath)}");
                        if (Directory.Exists(uploadsPath))
                        {
                            var files = Directory.GetFiles(uploadsPath, "*.m4a");
                            _logger.LogInformation($"[Giả lập] Found {files.Length} files in {uploadsPath}");
                            if (files.Length > 0)
                            {
                                var randomFile = Path.GetFileName(files[_rand.Next(files.Length)]);
                                randomAudioUrl = $"/uploads/{randomFile}";
                            }
                        }

                        // Gửi cảnh báo (sẽ tự động lưu DB và broadcast qua WebSocket)
                        await alertsService.SubmitDetection(randomDevice.Id, randomSoundType.ToString(), confidence, randomAudioUrl);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong quá trình giả lập cảnh báo.");
                }
            }
        }
    }
}
