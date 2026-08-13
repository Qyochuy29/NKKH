using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Services
{
    public class UsersService
    {
        private readonly ApplicationDbContext _db;

        public UsersService(ApplicationDbContext db) => _db = db;

        public async Task<List<object>> FindAll()
        {
            var query = from u in _db.Users
                        join s in _db.Students on u.Id equals s.ParentId into studentGroup
                        from sg in studentGroup.DefaultIfEmpty()
                        orderby u.CreatedAt descending
                        select new
                        {
                            u.Id,
                            full_name = u.FullName,
                            u.Email,
                            role = u.Role.ToString(),
                            created_at = u.CreatedAt,
                            classroom_id = sg != null ? sg.ClassroomId : null
                        };

            return await query.Select(x => (object)x).ToListAsync();
        }

        public async Task<object> Create(CreateUserDto dto)
        {
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Email đã được sử dụng");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 10),
                Role = Enum.Parse<Role>(dto.Role)
            };
            _db.Users.Add(user);

            if (user.Role == Role.phu_huynh && !string.IsNullOrEmpty(dto.ClassroomId))
            {
                var student = new Student
                {
                    FullName = "Học sinh của " + user.FullName,
                    ParentId = user.Id,
                    ClassroomId = dto.ClassroomId
                };
                _db.Students.Add(student);
            }

            await _db.SaveChangesAsync();
            return new { user.Id, full_name = user.FullName, user.Email, role = user.Role.ToString(), created_at = user.CreatedAt };
        }

        public async Task<object> Update(string id, UpdateUserDto dto)
        {
            var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException("Người dùng không tồn tại");

            if (dto.Email != null && dto.Email != user.Email)
            {
                if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
                    throw new InvalidOperationException("Email đã được sử dụng");
                user.Email = dto.Email;
            }

            if (dto.FullName != null) user.FullName = dto.FullName;
            if (dto.Role != null) user.Role = Enum.Parse<Role>(dto.Role);
            if (dto.Password != null) user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 10);

            if (user.Role == Role.phu_huynh && dto.ClassroomId != null)
            {
                var student = await _db.Students.FirstOrDefaultAsync(s => s.ParentId == id);
                if (student == null)
                {
                    student = new Student
                    {
                        FullName = "Học sinh của " + user.FullName,
                        ParentId = user.Id,
                        ClassroomId = dto.ClassroomId
                    };
                    _db.Students.Add(student);
                }
                else
                {
                    student.ClassroomId = dto.ClassroomId;
                }
            }

            await _db.SaveChangesAsync();
            return new { user.Id, full_name = user.FullName, user.Email, role = user.Role.ToString(), created_at = user.CreatedAt };
        }

        public async Task Remove(string id)
        {
            var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException("Người dùng không tồn tại");

            var hasAlerts = await _db.Alerts.AnyAsync(a => a.HandledById == id);
            var hasLogs = await _db.AlertLogs.AnyAsync(l => l.ActorId == id);
            if (hasAlerts || hasLogs)
                throw new InvalidOperationException("Không thể xóa người dùng đã có lịch sử hoạt động");

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }
}
