namespace SchoolGuardian.Api.DTOs
{
    // Auth DTOs
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RefreshDto
    {
        public string RefreshToken { get; set; }
    }

    // User DTOs
    public class CreateUserDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string? ClassroomId { get; set; }
    }

    public class UpdateUserDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
        public string? ClassroomId { get; set; }
    }

    // Area DTOs
    public class CreateAreaDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateAreaDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }

    // Device DTOs
    public class CreateDeviceDto
    {
        public string Name { get; set; }
        public string AreaId { get; set; }
        public int Floor { get; set; }
        public double PositionX { get; set; }
        public double PositionY { get; set; }
    }

    public class UpdateDeviceDto
    {
        public string? Name { get; set; }
        public string? AreaId { get; set; }
        public int? Floor { get; set; }
        public double? PositionX { get; set; }
        public double? PositionY { get; set; }
        public string? Status { get; set; }
        public int? BatteryLevel { get; set; }
    }

    // Alert DTOs
    public class CreateAlertDto
    {
        public string DeviceId { get; set; }
        public string SoundType { get; set; }
        public double ConfidenceScore { get; set; }
        public string? AudioFileUrl { get; set; }
    }

    public class UpdateAlertDto
    {
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public bool? IsEvidence { get; set; }
    }

    public class AlertQueryDto
    {
        public string? DateFrom { get; set; }
        public string? DateTo { get; set; }
        public string? Area { get; set; }
        public string? SoundType { get; set; }
        public string? Status { get; set; }
        public int Offset { get; set; } = 0;
        public int Limit { get; set; } = 20;
    }

    // Settings DTOs
    public class SettingItem
    {
        public string Key { get; set; }
        public string Value { get; set; }
    }

    public class UpdateSettingsDto
    {
        public List<SettingItem> Settings { get; set; }
    }
}
