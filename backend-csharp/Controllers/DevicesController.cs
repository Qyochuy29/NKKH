using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/devices")]
    [Authorize]
    public class DevicesController : ControllerBase
    {
        private readonly DevicesService _svc;
        public DevicesController(DevicesService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> FindAll() => Ok(await _svc.FindAll());

        [AllowAnonymous]
        [HttpGet("test")]
        public async Task<IActionResult> FindAllTest() => Ok(await _svc.FindAll());

        [HttpPost]
        [Authorize(Roles = "admin,ban_giam_hieu")]
        public async Task<IActionResult> Create([FromBody] CreateDeviceDto dto) => Ok(await _svc.Create(dto));

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,ban_giam_hieu")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateDeviceDto dto)
        {
            try { return Ok(await _svc.Update(id, dto)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,ban_giam_hieu")]
        public async Task<IActionResult> Remove(string id)
        {
            try { await _svc.Remove(id); return Ok(new { message = "Đã xóa thiết bị" }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}/status")]
        public async Task<IActionResult> GetStatus(string id)
        {
            try { return Ok(await _svc.GetStatus(id)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }
    }
}
