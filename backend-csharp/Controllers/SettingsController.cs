using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/settings")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly SettingsService _svc;
        public SettingsController(SettingsService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> FindAll() => Ok(await _svc.FindAll());

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Update([FromBody] UpdateSettingsDto dto) => Ok(await _svc.UpdateMany(dto.Settings));
    }
}
