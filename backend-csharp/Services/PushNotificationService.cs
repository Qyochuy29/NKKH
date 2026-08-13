using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Services
{
    public interface IPushNotificationService
    {
        Task SendAlertNotificationAsync(Alert alert, List<string> fcmTokens);
    }

    public class PushNotificationService : IPushNotificationService
    {
        private readonly ILogger<PushNotificationService> _logger;
        private readonly bool _isConfigured;

        public PushNotificationService(ILogger<PushNotificationService> logger, IConfiguration config)
        {
            _logger = logger;
            try
            {
                var credentialPath = config["Firebase:CredentialPath"];
                if (!string.IsNullOrEmpty(credentialPath) && File.Exists(credentialPath))
                {
                    if (FirebaseApp.DefaultInstance == null)
                    {
                        FirebaseApp.Create(new AppOptions()
                        {
                            Credential = GoogleCredential.FromFile(credentialPath),
                        });
                    }
                    _isConfigured = true;
                }
                else
                {
                    _logger.LogWarning("Firebase CredentialPath is empty or file not found. Push notifications will be disabled.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize FirebaseApp");
            }
        }

        public async Task SendAlertNotificationAsync(Alert alert, List<string> fcmTokens)
        {
            if (!_isConfigured || fcmTokens == null || !fcmTokens.Any()) return;

            var title = "Phát hiện cảnh báo mới!";
            var soundName = alert.SoundType switch
            {
                SoundType.scream => "tiếng la hét",
                SoundType.help => "tiếng kêu cứu",
                SoundType.threat => "tiếng đe dọa",
                SoundType.argument => "tiếng cãi vã",
                _ => "âm thanh bất thường"
            };

            var body = $"Phát hiện {soundName} tại {alert.Device?.Area?.Name ?? "khu vực không xác định"}";

            var message = new MulticastMessage()
            {
                Tokens = fcmTokens,
                Notification = new Notification()
                {
                    Title = title,
                    Body = body,
                },
                Data = new Dictionary<string, string>()
                {
                    { "alert_id", alert.Id },
                    { "sound_type", alert.SoundType.ToString() },
                    { "type", "alert" }
                }
            };

            try
            {
                var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
                _logger.LogInformation($"Successfully sent message: {response.SuccessCount} messages were sent successfully");

                if (response.FailureCount > 0)
                {
                    foreach (var resp in response.Responses.Where(r => !r.IsSuccess))
                    {
                        _logger.LogWarning($"Failed to send to token: {resp.Exception.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending push notification");
            }
        }
    }
}
