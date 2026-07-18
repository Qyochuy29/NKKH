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

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetSummary(role, userId));
        }

        [HttpGet("by-type")]
        public async Task<IActionResult> GetByType()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetByType(role, userId));
        }

        [HttpGet("by-area")]
        public async Task<IActionResult> GetByArea()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetByArea(role, userId));
        }

        [HttpGet("trend")]
        public async Task<IActionResult> GetTrend([FromQuery] string period = "day")
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetTrend(period, role, userId));
        }

        [HttpGet("heatmap")]
        public async Task<IActionResult> GetHeatmap()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetHeatmap(role, userId));
        }

        [HttpGet("ratio")]
        public async Task<IActionResult> GetRatio()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetAlertRatio(role, userId));
        }

        [HttpGet("hourly-today")]
        public async Task<IActionResult> GetHourlyToday()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Ok(await _svc.GetHourlyToday(role, userId));
        }

        [AllowAnonymous]
        [HttpGet("hourly-today-test")]
        public async Task<IActionResult> GetHourlyTodayTest() => Ok(await _svc.GetHourlyToday("admin", null));
    }
}
