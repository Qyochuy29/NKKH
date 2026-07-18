using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SchoolGuardian.Api.Services
{
    public class AuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<object> Login(string email, string password)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng");

            var accessToken = GenerateToken(user, _config["Jwt:Secret"]!, 30);
            var refreshToken = GenerateRefreshToken(user.Id, _config["Jwt:RefreshSecret"]!);

            return new
            {
                access_token = accessToken,
                refresh_token = refreshToken,
                user = new { user.Id, full_name = user.FullName, user.Email, role = user.Role.ToString() }
            };
        }

        public async Task<object> Refresh(string refreshToken)
        {
            try
            {
                var principal = ValidateToken(refreshToken, _config["Jwt:RefreshSecret"]!);
                var userId = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
                var user = await _db.Users.FindAsync(userId)
                    ?? throw new UnauthorizedAccessException("Token không hợp lệ");

                var newToken = GenerateToken(user, _config["Jwt:Secret"]!, 30);
                return new { access_token = newToken };
            }
            catch
            {
                throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn");
            }
        }

        public async Task<object> GetProfile(string userId)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new UnauthorizedAccessException("Người dùng không tồn tại");

            return new { user.Id, full_name = user.FullName, user.Email, role = user.Role.ToString(), created_at = user.CreatedAt };
        }

        private string GenerateToken(User user, string secret, int expiryMinutes)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role", user.Role.ToString()),
                new Claim("name", user.FullName),
            };
            var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddMinutes(expiryMinutes), signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken(string userId, string secret)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, userId) };
            var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddDays(7), signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private ClaimsPrincipal ValidateToken(string token, string secret)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var handler = new JwtSecurityTokenHandler();
            return handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = false,
                ValidateAudience = false,
            }, out _);
        }
    }
}
