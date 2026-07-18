using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Services
{
    public class SettingsService
    {
        private readonly ApplicationDbContext _db;

        public SettingsService(ApplicationDbContext db) => _db = db;

        public async Task<Dictionary<string, string>> FindAll()
        {
            return await _db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value);
        }

        public async Task<List<Setting>> UpdateMany(List<DTOs.SettingItem> settings)
        {
            var results = new List<Setting>();
            foreach (var item in settings)
            {
                var existing = await _db.Settings.FindAsync(item.Key);
                if (existing != null)
                {
                    existing.Value = item.Value;
                    results.Add(existing);
                }
                else
                {
                    var newSetting = new Setting { Key = item.Key, Value = item.Value };
                    _db.Settings.Add(newSetting);
                    results.Add(newSetting);
                }
            }
            await _db.SaveChangesAsync();
            return results;
        }
    }
}
