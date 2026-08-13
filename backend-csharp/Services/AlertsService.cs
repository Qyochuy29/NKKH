using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Models;
using SchoolGuardian.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace SchoolGuardian.Api.Services
{
    public class AlertsService
    {
        private readonly ApplicationDbContext _db;
        private readonly IHubContext<AlertHub> _hub;
        private readonly ILogger<AlertsService> _logger;
        private readonly IPushNotificationService _pushNotificationService;
        private readonly IHttpClientFactory _httpClientFactory;

        public AlertsService(ApplicationDbContext db, IHubContext<AlertHub> hub, ILogger<AlertsService> logger, IPushNotificationService pushNotificationService, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _hub = hub;
            _logger = logger;
            _pushNotificationService = pushNotificationService;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<object> FindAll(AlertQueryDto query, string? userRole, string? userId)
        {
            var q = _db.Alerts
                .Include(a => a.Device).ThenInclude(d => d.Area)
                .Include(a => a.HandledBy)
                .AsQueryable();

            if (userRole == AppConstants.Roles.PhuHuynh && !string.IsNullOrEmpty(userId))
            {
                var classroomIds = await _db.Students.Where(s => s.ParentId == userId).Select(s => s.ClassroomId).ToListAsync();
                q = q.Where(a => classroomIds.Contains(a.Device.AreaId));
            }

            if (!string.IsNullOrEmpty(query.DateFrom))
                q = q.Where(a => a.Timestamp >= DateTime.Parse(query.DateFrom));
            if (!string.IsNullOrEmpty(query.DateTo))
                q = q.Where(a => a.Timestamp <= DateTime.Parse(query.DateTo));
            if (!string.IsNullOrEmpty(query.SoundType) && Enum.TryParse<SoundType>(query.SoundType, out var st))
                q = q.Where(a => a.SoundType == st);
            if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<AlertStatus>(query.Status, out var s))
                q = q.Where(a => a.Status == s);
            if (!string.IsNullOrEmpty(query.Area))
                q = q.Where(a => a.Device.Area.Name.Contains(query.Area));

            var total = await q.CountAsync();
            var data = await q.OrderByDescending(a => a.Timestamp)
                .Skip(query.Offset).Take(query.Limit)
                .ToListAsync();

            bool canSeeAudio = true; // Allow all roles to hear the audio
            var result = data.Select(a => (object)new
            {
                a.Id,
                device_id = a.DeviceId,
                device = new { a.Device.Id, a.Device.Name, floor = a.Device.Floor, area = new { a.Device.Area.Id, a.Device.Area.Name } },
                timestamp = DateTime.SpecifyKind(a.Timestamp, DateTimeKind.Utc),
                sound_type = a.SoundType.ToString(),
                confidence_score = a.ConfidenceScore,
                audio_file_url = canSeeAudio ? (a.AudioData != null ? $"/api/alerts/{a.Id}/audio" : a.AudioFileUrl) : null,
                status = a.Status.ToString(),
                handled_by = a.HandledBy == null ? null : new { a.HandledBy.Id, full_name = a.HandledBy.FullName },
                resolved_at = a.ResolvedAt,
                a.Notes,
                is_evidence = a.IsEvidence,
                a.Transcript,
                a.Keywords,
                timestamp_seconds = a.TimestampSeconds,
                dialog_data = string.IsNullOrEmpty(a.DialogData) ? null : JsonSerializer.Deserialize<object>(a.DialogData, (JsonSerializerOptions?)null)
            }).ToList();

            return new { data = result, total, offset = query.Offset, limit = query.Limit };
        }

        public async Task<object> FindOne(string id, string? userRole, string? userId)
        {
            var a = await _db.Alerts
                .Include(x => x.Device).ThenInclude(d => d.Area)
                .Include(x => x.HandledBy)
                .Include(x => x.Logs).ThenInclude(l => l.Actor)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException("Không tìm thấy cảnh báo");

            if (userRole == AppConstants.Roles.PhuHuynh && !string.IsNullOrEmpty(userId))
            {
                var classroomIds = await _db.Students.Where(s => s.ParentId == userId).Select(s => s.ClassroomId).ToListAsync();
                if (!classroomIds.Contains(a.Device.AreaId))
                    throw new KeyNotFoundException("Không tìm thấy cảnh báo");
            }

            bool canSeeAudio = true; // Allow all roles to hear the audio
            return new
            {
                a.Id,
                device_id = a.DeviceId,
                device = new { a.Device.Id, a.Device.Name, floor = a.Device.Floor, area = new { a.Device.Area.Id, a.Device.Area.Name } },
                timestamp = DateTime.SpecifyKind(a.Timestamp, DateTimeKind.Utc),
                sound_type = a.SoundType.ToString(),
                confidence_score = a.ConfidenceScore,
                audio_file_url = canSeeAudio ? (a.AudioData != null ? $"/api/alerts/{a.Id}/audio" : a.AudioFileUrl) : null,
                status = a.Status.ToString(),
                handled_by = a.HandledBy == null ? null : new { a.HandledBy.Id, full_name = a.HandledBy.FullName, role = a.HandledBy.Role.ToString() },
                resolved_at = a.ResolvedAt,
                a.Notes,
                is_evidence = a.IsEvidence,
                a.Transcript,
                a.Keywords,
                timestamp_seconds = a.TimestampSeconds,
                dialog_data = string.IsNullOrEmpty(a.DialogData) ? null : JsonSerializer.Deserialize<object>(a.DialogData, (JsonSerializerOptions?)null),
                logs = a.Logs?.OrderBy(l => l.Timestamp).Select(l => new
                {
                    l.Id,
                    l.Action,
                    timestamp = DateTime.SpecifyKind(l.Timestamp, DateTimeKind.Utc),
                    actor = new { l.Actor.Id, full_name = l.Actor.FullName, role = l.Actor.Role.ToString() }
                })
            };
        }

        public async Task<object> SubmitDetection(string deviceId, string soundType, double confidence, string? audioUrl = null, string? notes = null, byte[]? audioData = null, string? dialogData = null)
        {
            var alert = new Alert
            {
                DeviceId = deviceId,
                SoundType = Enum.Parse<SoundType>(soundType),
                ConfidenceScore = confidence,
                AudioFileUrl = audioUrl,
                AudioData = audioData,
                DialogData = dialogData,
                Notes = notes,
                Status = AlertStatus.pending
            };
            _db.Alerts.Add(alert);
            await _db.SaveChangesAsync();

            await _db.Entry(alert).Reference(a => a.Device).LoadAsync();
            await _db.Entry(alert.Device).Reference(d => d.Area).LoadAsync();

            // Broadcast via SignalR with Role-Based Access Control
            var alertDto = await FindOne(alert.Id, "admin", null);
            var allowedUserIds = await GetAllowedUserIdsForAreaAsync(alert.Device.AreaId);
            await _hub.Clients.Users(allowedUserIds).SendAsync("new-alert", alertDto);
            _logger.LogInformation("Broadcasting new alert: {Id} to {Count} users", alert.Id, allowedUserIds.Count);

            // Send Push Notifications
            var tokens = await _db.UserDevices
                .Where(ud => allowedUserIds.Contains(ud.UserId) && !string.IsNullOrEmpty(ud.FcmToken))
                .Select(ud => ud.FcmToken)
                .ToListAsync();

            if (tokens.Any())
            {
                await _pushNotificationService.SendAlertNotificationAsync(alert, tokens);
            }

            return alertDto;
        }

        public async Task<object> AnalyzeUploadedAudio(string audioUrl, string originalName = "")
        {
            var devices = await _db.Devices.Where(d => d.Status == DeviceStatus.online).ToListAsync();
            var device = devices.Count > 0
                ? devices[Random.Shared.Next(devices.Count)]
                : await _db.Devices.FirstOrDefaultAsync()
                ?? throw new Exception("No devices available to bind alert");

            var createdAlerts = new List<object>();

            try
            {
                var absolutePath = Path.GetFileName(audioUrl);
                using var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromMinutes(5); // Chờ lâu
                var response = await client.PostAsJsonAsync("http://host.docker.internal:5000/analyze-full", new { filepath = absolutePath });
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                    var dialogData = result.TryGetProperty("dialog_data", out var d) ? d.GetRawText() : null;

                    if (result.TryGetProperty("alerts", out var alertsArr) && alertsArr.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var alertJson in alertsArr.EnumerateArray())
                        {
                            var soundType = alertJson.GetProperty("soundType").GetString() ?? "argument";
                            var confidence = alertJson.GetProperty("confidence").GetDouble();
                            var filename = alertJson.GetProperty("filename").GetString();
                            var finalAudioUrl = $"/uploads/{filename}";
                            var startTime = alertJson.TryGetProperty("start_time_seconds", out var st) ? st.GetDouble() : 0;
                            // Text thuần — không dùng HTML trong Service layer (Fix #14)
                            var typeLabel = soundType switch {
                                "help"     => AppConstants.SoundLabels.Help,
                                "threat"   => AppConstants.SoundLabels.Threat,
                                "scream"   => AppConstants.SoundLabels.Scream,
                                "argument" => AppConstants.SoundLabels.Argument,
                                _          => AppConstants.SoundLabels.Unknown
                            };
                            var transcript = alertJson.TryGetProperty("transcript", out var t) ? t.GetString() : null;
                            var notes = !string.IsNullOrEmpty(transcript)
                                ? $"[Giây {startTime:F1}] {typeLabel}: \"{transcript}\""
                                : $"[Giây {startTime:F1}] {typeLabel}: Không rõ tiếng.";

                            byte[]? audioBytes = null;
                            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", filename);
                            if (File.Exists(fullPath))
                            {
                                audioBytes = await File.ReadAllBytesAsync(fullPath);
                            }

                            var alertRecord = await SubmitDetection(device.Id, soundType, confidence, finalAudioUrl, notes, audioBytes, dialogData);
                            createdAlerts.Add(alertRecord);
                        }
                    }
                }
                else
                {
                    var errText = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("AI Service trả về lỗi: {Code}. Detail: {Err}", response.StatusCode, errText);
                    throw new Exception($"AI Server Error ({response.StatusCode}): {errText}");
                }
            }
            catch (Exception e)
            {
                _logger.LogError("Failed to reach AI service: {Msg}", e.Message);
                throw new Exception($"Không thể phân tích âm thanh: {e.Message}");
            }

            return new { success = true, totalAlerts = createdAlerts.Count, alerts = createdAlerts };
        }

        public async Task<object> AnalyzeDialogAudio(string audioUrl)
        {
            try
            {
                var absolutePath = Path.GetFileName(audioUrl);
                using var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromMinutes(10);
                var response = await client.PostAsJsonAsync("http://host.docker.internal:5000/analyze-dialog", new { filepath = absolutePath });
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                    return result;
                }
                else
                {
                    var errText = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("AI Service trả về lỗi: {Code}. Detail: {Err}", response.StatusCode, errText);
                    throw new Exception($"AI Server Error ({response.StatusCode}): {errText}");
                }
            }
            catch (Exception e)
            {
                _logger.LogError("Failed to reach AI service: {Msg}", e.Message);
                throw new Exception($"Không thể phân tích đối thoại: {e.Message}");
            }
        }

        public async Task<object> UpdateAlert(string id, UpdateAlertDto dto, string userId)
        {
            var alert = await _db.Alerts.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy cảnh báo");

            if (dto.Status != null)
            {
                if (alert.Status == AlertStatus.resolved || alert.Status == AlertStatus.false_alarm)
                {
                    if (alert.Status.ToString() != dto.Status)
                        throw new InvalidOperationException("Cảnh báo này đã được xử lý xong");
                }

                alert.Status = Enum.Parse<AlertStatus>(dto.Status);
                if (dto.Status != "pending")
                {
                    alert.HandledById = userId;
                    alert.ResolvedAt = DateTime.UtcNow;
                }
            }
            if (dto.Notes != null) alert.Notes = dto.Notes;
            if (dto.IsEvidence.HasValue) alert.IsEvidence = dto.IsEvidence.Value;

            await _db.SaveChangesAsync();

            if (dto.Status != null)
            {
                var actionMap = new Dictionary<string, string>
                {
                    ["confirmed"]  = AppConstants.AlertActions.Confirmed,
                    ["false_alarm"] = AppConstants.AlertActions.FalseAlarm,
                    ["resolved"]   = AppConstants.AlertActions.Resolved
                };
                _db.AlertLogs.Add(new AlertLog
                {
                    AlertId = id,
                    Action = actionMap.TryGetValue(dto.Status, out var a) ? a : $"Cập nhật: {dto.Status}",
                    ActorId = userId
                });
                await _db.SaveChangesAsync();
            }

            var updated = await FindOne(id, "admin", null);

            var alertWithDevice = await _db.Alerts.Include(a => a.Device).FirstOrDefaultAsync(a => a.Id == id);
            if (alertWithDevice != null)
            {
                var allowedUserIds = await GetAllowedUserIdsForAreaAsync(alertWithDevice.Device.AreaId);
                await _hub.Clients.Users(allowedUserIds).SendAsync("alert-updated", updated);
            }
            return updated;
        }

        public async Task<int> GetPendingCount()
            => await _db.Alerts.CountAsync(a => a.Status == AlertStatus.pending);

        private async Task<List<string>> GetAllowedUserIdsForAreaAsync(string areaId)
        {
            var area = await _db.Areas.FindAsync(areaId);
            if (area == null) return new List<string>();

            // Admin, Ban Giam Hieu see everything
            var roles = new[] { Role.admin, Role.ban_giam_hieu, Role.bao_ve };
            var allowedUserIds = await _db.Users
                .Where(u => roles.Contains(u.Role))
                .Select(u => u.Id)
                .ToListAsync();

            // Teachers (giam_thi) might be assigned to specific areas, but for simplicity we allow them all or restrict them
            var giamThiIds = await _db.Users.Where(u => u.Role == Role.giam_thi).Select(u => u.Id).ToListAsync();
            allowedUserIds.AddRange(giamThiIds);

            // Parents only for their children's classrooms
            var parentIds = await _db.Students
                .Where(s => s.ClassroomId == areaId)
                .Select(s => s.ParentId)
                .ToListAsync();

            allowedUserIds.AddRange(parentIds);
            return allowedUserIds.Distinct().ToList();
        }

        public async Task<int> SyncOfflineActions(List<OfflineActionDto> actions, string userId, string userRole)
        {
            int successCount = 0;
            foreach (var action in actions.OrderBy(a => a.TimestampSeconds))
            {
                var alert = await _db.Alerts.FindAsync(action.AlertId);
                if (alert == null) continue;

                if (action.Action == AppConstants.OfflineActions.UpdateStatus && !string.IsNullOrEmpty(action.Status))
                {
                    if (Enum.TryParse<AlertStatus>(action.Status, out var newStatus))
                    {
                        alert.Status = newStatus;
                        alert.HandledById = userId;
                        if (newStatus == AlertStatus.resolved || newStatus == AlertStatus.false_alarm)
                        {
                            alert.ResolvedAt = DateTime.UtcNow;
                        }

                        _db.AlertLogs.Add(new AlertLog
                        {
                            AlertId = alert.Id,
                            Action = $"Status changed to {newStatus} (Sync)",
                            ActorId = userId,
                            Timestamp = DateTimeOffset.FromUnixTimeSeconds((long)action.TimestampSeconds).UtcDateTime
                        });
                        successCount++;
                    }
                }
                else if (action.Action == AppConstants.OfflineActions.AddNote && !string.IsNullOrEmpty(action.Notes))
                {
                    alert.Notes = string.IsNullOrEmpty(alert.Notes) ? action.Notes : alert.Notes + "\n" + action.Notes;
                    _db.AlertLogs.Add(new AlertLog
                    {
                        AlertId = alert.Id,
                        Action = "Added note (Sync)",
                        ActorId = userId,
                        Timestamp = DateTimeOffset.FromUnixTimeSeconds((long)action.TimestampSeconds).UtcDateTime
                    });
                    successCount++;
                }
            }
            await _db.SaveChangesAsync();
            return successCount;
        }
    }
}
