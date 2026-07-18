using Microsoft.AspNetCore.SignalR;

namespace SchoolGuardian.Api.Hubs
{
    /// <summary>
    /// SignalR Hub - thay thế Socket.IO Gateway trong NestJS.
    /// Frontend kết nối tới /ws/alerts để nhận cảnh báo real-time.
    /// </summary>
    public class AlertHub : Hub
    {
        private readonly ILogger<AlertHub> _logger;

        public AlertHub(ILogger<AlertHub> logger) => _logger = logger;

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("Client connected: {Id}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("Client disconnected: {Id}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
