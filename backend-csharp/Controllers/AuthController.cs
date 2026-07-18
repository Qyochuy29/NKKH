using Microsoft.AspNetCore.Mvc;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Services;

namespace SchoolGuardian.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;
        public AuthController(AuthService auth) => _auth = auth;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try { return Ok(await _auth.Login(dto.Email, dto.Password)); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshDto dto)
        {
            try { return Ok(await _auth.Refresh(dto.RefreshToken)); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        }

        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst("sub")?.Value ?? "";
            try { return Ok(await _auth.GetProfile(userId)); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        }
    }
}
