using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Extensions;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;
using SchoolGuardian.Api.Data;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/alerts")]
    [Authorize]
    public class AlertsController : ControllerBase
    {
        private readonly AlertsService _svc;
        public AlertsController(AlertsService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> FindAll([FromQuery] AlertQueryDto query)
        {
            var role = User.GetUserRole();
            var userId = User.GetUserId();
            return Ok(await _svc.FindAll(query, role, userId));
        }

        [AllowAnonymous]
        [HttpGet("test")]
        public async Task<IActionResult> FindAllTest([FromQuery] AlertQueryDto query)
        {
            return Ok(await _svc.FindAll(query, "admin", null));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> FindOne(string id)
        {
            var role = User.GetUserRole();
            var userId = User.GetUserId();
            try { return Ok(await _svc.FindOne(id, role, userId)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] CreateAlertDto dto, [FromServices] IConfiguration config)
        {
            var token = Request.Headers["X-Device-Token"].FirstOrDefault();
            if (string.IsNullOrEmpty(token) || token != config["DeviceToken"])
                return Unauthorized(new { message = "Invalid Device Token" });
            return Ok(await _svc.SubmitDetection(dto.DeviceId, dto.SoundType, dto.ConfidenceScore, dto.AudioFileUrl));
        }

        [HttpPost("upload")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadAudio(IFormFile? audio, [FromServices] IConfiguration config)
        {
            // Cho phép ESP32/thiết bị phần cứng dùng X-Device-Token thay cho JWT
            var deviceToken = Request.Headers["X-Device-Token"].FirstOrDefault();
            bool isAuthenticated = User.Identity?.IsAuthenticated == true;
            bool hasValidDeviceToken = !string.IsNullOrEmpty(deviceToken) && deviceToken == config["DeviceToken"];

            if (!isAuthenticated && !hasValidDeviceToken)
                return Unauthorized(new { message = "Vui lòng đăng nhập hoặc cung cấp Device Token hợp lệ" });

            if (audio == null || audio.Length == 0)
                return BadRequest(new { error = "No file uploaded" });

            if (audio.Length > 50 * 1024 * 1024)
                return BadRequest(new { error = "File size exceeds 50MB limit" });

            var ext = Path.GetExtension(audio.FileName).ToLower();
            var allowedExts = new[] { ".wav", ".mp3", ".m4a" };
            if (!allowedExts.Contains(ext))
                return BadRequest(new { error = "Invalid file type. Allowed: .wav, .mp3, .m4a" });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            Directory.CreateDirectory(uploadsDir);
            var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(audio.FileName)}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = System.IO.File.Create(filePath))
                await audio.CopyToAsync(stream);

            return Ok(await _svc.AnalyzeUploadedAudio($"/uploads/{fileName}", audio.FileName));
        }

        public class AnalyzeExistingDto
        {
            public string FileName { get; set; } = string.Empty;
        }

        [HttpPost("analyze-existing")]
        [AllowAnonymous]
        public async Task<IActionResult> AnalyzeExisting([FromBody] AnalyzeExistingDto dto, [FromServices] IConfiguration config)
        {
            var deviceToken = Request.Headers["X-Device-Token"].FirstOrDefault();
            bool isAuthenticated = User.Identity?.IsAuthenticated == true;
            bool hasValidDeviceToken = !string.IsNullOrEmpty(deviceToken) && deviceToken == config["DeviceToken"];

            if (!isAuthenticated && !hasValidDeviceToken)
                return Unauthorized(new { message = "Vui lòng đăng nhập hoặc cung cấp Device Token hợp lệ" });

            if (string.IsNullOrEmpty(dto.FileName))
                return BadRequest(new { error = "FileName is required" });

            // File đã nằm trong thư mục uploads/ (hoặc tai-lieu) nhờ websocket_receiver
            return Ok(await _svc.AnalyzeUploadedAudio($"/uploads/{dto.FileName}", dto.FileName));
        }

        [HttpPost("upload-dialog")]
        public async Task<IActionResult> UploadDialogAudio(IFormFile audio)
        {
            if (audio == null || audio.Length == 0)
                return BadRequest(new { error = "No file uploaded" });

            if (audio.Length > 50 * 1024 * 1024)
                return BadRequest(new { error = "File size exceeds 50MB limit" });

            var ext = Path.GetExtension(audio.FileName).ToLower();
            var allowedExts = new[] { ".wav", ".mp3", ".m4a" };
            if (!allowedExts.Contains(ext))
                return BadRequest(new { error = "Invalid file type. Allowed: .wav, .mp3, .m4a" });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            Directory.CreateDirectory(uploadsDir);
            var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(audio.FileName)}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = System.IO.File.Create(filePath))
                await audio.CopyToAsync(stream);

            return Ok(await _svc.AnalyzeDialogAudio($"/uploads/{fileName}"));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAlertDto dto)
        {
            var userId = User.GetUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid user token" });

            try { return Ok(await _svc.UpdateAlert(id, dto, userId)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("sync")]
        public async Task<IActionResult> Sync([FromBody] List<OfflineActionDto> actions)
        {
            var userId = User.GetUserId();
            var userRole = User.GetUserRole();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid user token" });

            try
            {
                int syncedCount = await _svc.SyncOfflineActions(actions, userId, userRole);
                return Ok(new { message = $"Đã đồng bộ {syncedCount} thao tác ngoại tuyến thành công", syncedCount });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}/audio")]
        public async Task<IActionResult> GetAudio(string id, [FromServices] ApplicationDbContext db)
        {
            var alert = await db.Alerts.FindAsync(id);
            if (alert == null || alert.AudioData == null)
            {
                return NotFound();
            }

            var contentType = "audio/mpeg";
            if (!string.IsNullOrEmpty(alert.AudioFileUrl))
            {
                var ext = Path.GetExtension(alert.AudioFileUrl).ToLower();
                if (ext == ".wav") contentType = "audio/wav";
                else if (ext == ".m4a") contentType = "audio/mp4";
            }

            return File(alert.AudioData, contentType);
        }
    }
}
