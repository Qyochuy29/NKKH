using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/areas")]
    [Authorize]
    public class AreasController : ControllerBase
    {
        private readonly AreasService _svc;
        public AreasController(AreasService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> FindAll() => Ok(await _svc.FindAll());

        [HttpGet("{id}")]
        public async Task<IActionResult> FindOne(string id)
        {
            try { return Ok(await _svc.FindOne(id)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPost]
        [Authorize(Roles = "admin,ban_giam_hieu")]
        public async Task<IActionResult> Create([FromBody] CreateAreaDto dto)
        {
            try { return Ok(await _svc.Create(dto)); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,ban_giam_hieu")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAreaDto dto)
        {
            try { return Ok(await _svc.Update(id, dto)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,ban_giam_hieu")]
        public async Task<IActionResult> Remove(string id)
        {
            try { await _svc.Remove(id); return Ok(new { message = "Đã xóa khu vực" }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }
    }
}
