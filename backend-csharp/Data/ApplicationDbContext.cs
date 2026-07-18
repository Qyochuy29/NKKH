using Microsoft.EntityFrameworkCore;
using SchoolGuardian.Api.Models;

namespace SchoolGuardian.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Area> Areas { get; set; }
        public DbSet<Device> Devices { get; set; }
        public DbSet<Alert> Alerts { get; set; }
        public DbSet<AlertLog> AlertLogs { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Student> Students { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Postgres Enums
            modelBuilder.HasPostgresEnum<Role>(name: "Role");
            modelBuilder.HasPostgresEnum<DeviceStatus>(name: "DeviceStatus");
            modelBuilder.HasPostgresEnum<SoundType>(name: "SoundType");
            modelBuilder.HasPostgresEnum<AlertStatus>(name: "AlertStatus");

            // Unique constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasColumnType("Role");

            modelBuilder.Entity<Device>()
                .Property(d => d.Status)
                .HasColumnType("DeviceStatus");

            modelBuilder.Entity<Area>()
                .HasIndex(a => a.Name)
                .IsUnique();

            modelBuilder.Entity<Alert>()
                .Property(a => a.SoundType)
                .HasColumnType("SoundType");
            modelBuilder.Entity<Alert>()
                .Property(a => a.Status)
                .HasColumnType("AlertStatus");

            modelBuilder.Entity<Setting>()
                .HasIndex(s => s.Key)
                .IsUnique();

            // Explicit relationship configuration matching Prisma
            modelBuilder.Entity<Alert>()
                .HasOne(a => a.Device)
                .WithMany(d => d.Alerts)
                .HasForeignKey(a => a.DeviceId);

            modelBuilder.Entity<Alert>()
                .HasOne(a => a.HandledBy)
                .WithMany(u => u.HandledAlerts)
                .HasForeignKey(a => a.HandledById);

            modelBuilder.Entity<AlertLog>()
                .HasOne(al => al.Alert)
                .WithMany(a => a.Logs)
                .HasForeignKey(al => al.AlertId);

            modelBuilder.Entity<AlertLog>()
                .HasOne(al => al.Actor)
                .WithMany(u => u.AlertLogs)
                .HasForeignKey(al => al.ActorId);
        }
    }
}
