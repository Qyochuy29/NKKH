using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SchoolGuardian.Api.Extensions;

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

        public async Task<object> SocialLogin(string provider, string token, string email, string fullName)
        {
            // In a real app, verify the provider token with Google/Apple here.
            // For now, we mock the verification and just use the email.
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            
            if (user == null)
            {
                // Auto-register user if not found
                user = new User
                {
                    Email = email,
                    FullName = fullName,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), 10), // Random password
                    Role = Role.giam_thi // Default role for social login
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

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
                var userId = principal.GetUserId();
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

        public async Task ChangePassword(string userId, string oldPassword, string newPassword)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new UnauthorizedAccessException("Người dùng không tồn tại");

            if (!BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Mật khẩu cũ không chính xác");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 10);
            await _db.SaveChangesAsync();
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

        public async Task UpdateFcmTokenAsync(string userId, string fcmToken, string? deviceName = null)
        {
            var user = await _db.Users.Include(u => u.Devices).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new Exception("Người dùng không tồn tại");
            }

            // Check if token already exists for this user
            var existingDevice = user.Devices?.FirstOrDefault(d => d.FcmToken == fcmToken);
            if (existingDevice != null)
            {
                existingDevice.LastActive = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(deviceName)) existingDevice.DeviceName = deviceName;
            }
            else
            {
                // Optional: limit devices per user to prevent spam
                if (user.Devices != null && user.Devices.Count >= 5)
                {
                    var oldest = user.Devices.OrderBy(d => d.LastActive).First();
                    _db.UserDevices.Remove(oldest);
                }

                _db.UserDevices.Add(new UserDevice
                {
                    UserId = userId,
                    FcmToken = fcmToken,
                    DeviceName = deviceName,
                    LastActive = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
        }
    }
}
