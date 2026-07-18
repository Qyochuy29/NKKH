using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.DTOs;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Services
{
    public class DevicesService
    {
        private readonly ApplicationDbContext _db;

        public DevicesService(ApplicationDbContext db) => _db = db;

        public async Task<List<object>> FindAll()
        {
            return await _db.Devices
                .Include(d => d.Area)
                .OrderBy(d => d.Floor).ThenBy(d => d.Name)
                .Select(d => (object)new
                {
                    d.Id, d.Name, d.Floor, d.PositionX, d.PositionY,
                    status = d.Status.ToString(),
                    battery_level = d.BatteryLevel,
                    last_seen = d.LastSeen,
                    area_id = d.AreaId,
                    area = new { d.Area.Id, d.Area.Name }
                })
                .ToListAsync();
        }

        public async Task<object> FindOne(string id)
        {
            var d = await _db.Devices.Include(x => x.Area).FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException("Không tìm thấy thiết bị");
            return new
            {
                d.Id, d.Name, d.Floor, d.PositionX, d.PositionY,
                status = d.Status.ToString(),
                battery_level = d.BatteryLevel,
                last_seen = d.LastSeen,
                area_id = d.AreaId,
                area = new { d.Area.Id, d.Area.Name }
            };
        }

        public async Task<object> Create(CreateDeviceDto dto)
        {
            var device = new Device
            {
                Name = dto.Name,
                AreaId = dto.AreaId,
                Floor = dto.Floor,
                PositionX = dto.PositionX,
                PositionY = dto.PositionY,
            };
            _db.Devices.Add(device);
            await _db.SaveChangesAsync();
            return await FindOne(device.Id);
        }

        public async Task<object> Update(string id, UpdateDeviceDto dto)
        {
            var device = await _db.Devices.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy thiết bị");
            if (dto.Name != null) device.Name = dto.Name;
            if (dto.AreaId != null) device.AreaId = dto.AreaId;
            if (dto.Floor.HasValue) device.Floor = dto.Floor.Value;
            if (dto.PositionX.HasValue) device.PositionX = dto.PositionX.Value;
            if (dto.PositionY.HasValue) device.PositionY = dto.PositionY.Value;
            if (dto.Status != null) device.Status = Enum.Parse<DeviceStatus>(dto.Status);
            if (dto.BatteryLevel.HasValue) device.BatteryLevel = dto.BatteryLevel.Value;
            device.LastSeen = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return await FindOne(id);
        }

        public async Task<object> GetStatus(string id)
        {
            return await _db.Devices
                .Where(d => d.Id == id)
                .Select(d => (object)new { d.Id, d.Name, status = d.Status.ToString(), battery_level = d.BatteryLevel, last_seen = d.LastSeen })
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Không tìm thấy thiết bị");
        }

        public async Task Remove(string id)
        {
            var device = await _db.Devices.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy thiết bị");
            var hasAlerts = await _db.Alerts.AnyAsync(a => a.DeviceId == id);
            if (hasAlerts) throw new InvalidOperationException("Không thể xóa thiết bị đã có lịch sử cảnh báo");
            _db.Devices.Remove(device);
            await _db.SaveChangesAsync();
        }
    }
}
