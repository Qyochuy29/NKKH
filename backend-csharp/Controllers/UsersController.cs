using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = "admin")]
    public class UsersController : ControllerBase
    {
        private readonly UsersService _svc;
        public UsersController(UsersService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> FindAll() => Ok(await _svc.FindAll());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            try { return Ok(await _svc.Create(dto)); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto dto)
        {
            try { return Ok(await _svc.Update(id, dto)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(string id)
        {
            try { await _svc.Remove(id); return Ok(new { message = "Đã xóa người dùng" }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }
    }
}
