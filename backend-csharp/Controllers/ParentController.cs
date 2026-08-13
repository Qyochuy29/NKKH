using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.Extensions;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/parent")]
    [Authorize]
    public class ParentController : ControllerBase
    {
        private readonly ParentService _svc;

        public ParentController(ParentService svc) => _svc = svc;

        [HttpGet("stats")]
        public async Task<IActionResult> GetParentStats()
        {
            var userId = User.GetUserId();
            var role   = User.GetUserRole();

            if (string.IsNullOrEmpty(userId) || role != AppConstants.Roles.PhuHuynh)
                return Forbid();

            return Ok(await _svc.GetStatsAsync(userId));
        }

        [HttpGet("alerts")]
        public async Task<IActionResult> GetParentAlerts([FromQuery] string? sound_type)
        {
            var userId = User.GetUserId();
            var role   = User.GetUserRole();

            if (string.IsNullOrEmpty(userId) || role != AppConstants.Roles.PhuHuynh)
                return Forbid();

            return Ok(await _svc.GetAlertsAsync(userId, sound_type));
        }
    }
}
