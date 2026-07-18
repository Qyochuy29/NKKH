using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/parent")]
    [Authorize]
    public class ParentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ParentController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<List<string>> GetParentClassroomIdsAsync(string parentId)
        {
            return await _context.Students
                .Where(s => s.ParentId == parentId)
                .Select(s => s.ClassroomId)
                .ToListAsync();
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetParentStats()
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            var role = User.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

            if (userId == null || role != "phu_huynh")
            {
                return Forbid();
            }

            var classroomIds = await GetParentClassroomIdsAsync(userId);
            if (!classroomIds.Any())
            {
                return Ok(new { alerts_today = 0, alerts_by_type = new object[] {}, hourly_trend = new object[] {} });
            }

            var today = DateTime.UtcNow.Date;

            // Alerts today in parent's classrooms
            var alertsQuery = _context.Alerts
                .Include(a => a.Device)
                .Where(a => classroomIds.Contains(a.Device.AreaId) && a.Timestamp >= today);

            var totalAlerts = await alertsQuery.CountAsync();

            var alertsByType = await alertsQuery
                .GroupBy(a => a.SoundType)
                .Select(g => new { sound_type = g.Key.ToString(), count = g.Count() })
                .ToListAsync();

            var hourlyTrend = await alertsQuery
                .GroupBy(a => a.Timestamp.Hour)
                .Select(g => new { hour = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                alerts_today = totalAlerts,
                alerts_by_type = alertsByType,
                hourly_trend = hourlyTrend
            });
        }

        [HttpGet("alerts")]
        public async Task<IActionResult> GetParentAlerts([FromQuery] string? sound_type)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            var role = User.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

            if (userId == null || role != "phu_huynh")
            {
                return Forbid();
            }

            var classroomIds = await GetParentClassroomIdsAsync(userId);
            if (!classroomIds.Any())
            {
                return Ok(new List<object>());
            }

            var query = _context.Alerts
                .Include(a => a.Device)
                .ThenInclude(d => d.Area)
                .Where(a => classroomIds.Contains(a.Device.AreaId));

            if (!string.IsNullOrEmpty(sound_type) && Enum.TryParse<SoundType>(sound_type, true, out var parsedType))
            {
                query = query.Where(a => a.SoundType == parsedType);
            }

            var alerts = await query
                .OrderByDescending(a => a.Timestamp)
                .Take(50)
                .Select(a => new
                {
                    id = a.Id,
                    timestamp = a.Timestamp,
                    sound_type = a.SoundType.ToString(),
                    confidence_score = a.ConfidenceScore,
                    status = a.Status.ToString(),
                    audio_file_url = a.AudioFileUrl,
                    device_name = a.Device.Name,
                    area_name = a.Device.Area.Name
                })
                .ToListAsync();

            return Ok(alerts);
        }
    }
}
