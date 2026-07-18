using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;

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
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
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
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
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
        public async Task<IActionResult> UploadAudio(IFormFile audio)
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

            return Ok(await _svc.AnalyzeUploadedAudio($"/uploads/{fileName}", audio.FileName));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAlertDto dto)
        {
            var userId = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst("sub")?.Value ?? "";
            
            if (string.IsNullOrEmpty(userId)) 
                return Unauthorized(new { message = "Invalid user token" });

            try { return Ok(await _svc.UpdateAlert(id, dto, userId)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }
    }
}
