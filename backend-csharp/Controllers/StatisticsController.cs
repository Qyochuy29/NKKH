using SchoolGuardian.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/statistics")]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly StatisticsService _svc;
        public StatisticsController(StatisticsService svc) => _svc = svc;

        // Dùng extension method thay vì lặp lại FindFirst(...) mỗi action (Fix #10)
        private string? Role   => User.GetUserRole();
        private string? UserId => User.GetUserId();

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
            => Ok(await _svc.GetSummary(Role, UserId));

        [HttpGet("by-type")]
        public async Task<IActionResult> GetByType()
            => Ok(await _svc.GetByType(Role, UserId));

        [HttpGet("by-area")]
        public async Task<IActionResult> GetByArea()
            => Ok(await _svc.GetByArea(Role, UserId));

        [HttpGet("trend")]
        public async Task<IActionResult> GetTrend([FromQuery] string period = "day")
            => Ok(await _svc.GetTrend(period, Role, UserId));

        [HttpGet("heatmap")]
        public async Task<IActionResult> GetHeatmap()
            => Ok(await _svc.GetHeatmap(Role, UserId));

        [HttpGet("ratio")]
        public async Task<IActionResult> GetRatio()
            => Ok(await _svc.GetAlertRatio(Role, UserId));

        [HttpGet("hourly-today")]
        public async Task<IActionResult> GetHourlyToday()
            => Ok(await _svc.GetHourlyToday(Role, UserId));
    }
}
