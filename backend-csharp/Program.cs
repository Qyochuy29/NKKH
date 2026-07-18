using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SchoolGuardian.Api.Data;
using SchoolGuardian.Api.Hubs;
using SchoolGuardian.Api.Models;
using SchoolGuardian.Api.Services;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. Database - Entity Framework Core with PostgreSQL
// QUAN TRỌNG: Phải đăng ký Postgres Enum trước khi tạo DbContext
// vì database dùng native PostgreSQL enum types (public.Role, v.v.)
// ============================================================
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")!;

// Đăng ký tất cả các Postgres Enum types (tên phân biệt hoa thường theo Prisma)
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connStr);
dataSourceBuilder.MapEnum<Role>("Role");
dataSourceBuilder.MapEnum<DeviceStatus>("DeviceStatus");
dataSourceBuilder.MapEnum<SoundType>("SoundType");
dataSourceBuilder.MapEnum<AlertStatus>("AlertStatus");
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(dataSource, o => 
    {
        o.MapEnum<Role>("Role");
        o.MapEnum<DeviceStatus>("DeviceStatus");
        o.MapEnum<SoundType>("SoundType");
        o.MapEnum<AlertStatus>("AlertStatus");
    }));


// ============================================================
// 2. JWT Authentication (thay thế Passport-JWT của NestJS)
// ============================================================
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "changeme_secret_key_at_least_32_chars";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
        // Allow JWT via SignalR query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && context.Request.Path.StartsWithSegments("/ws"))
                    context.Token = token;
                return Task.CompletedTask;
            }
        };
    });

// ============================================================
// 3. CORS - allow frontend to connect
// ============================================================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ============================================================
// 4. SignalR (thay thế Socket.IO của NestJS)
// ============================================================
builder.Services.AddSignalR()
    .AddJsonProtocol(options => {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });

// ============================================================
// 5. Dependency Injection - Register all Services
// ============================================================
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsersService>();
builder.Services.AddScoped<AreasService>();
builder.Services.AddScoped<DevicesService>();
builder.Services.AddScoped<AlertsService>();
builder.Services.AddScoped<StatisticsService>();
builder.Services.AddScoped<SettingsService>();
builder.Services.AddHostedService<SimulatorBackgroundService>();

// ============================================================
// 6. Controllers + OpenAPI
// ============================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });
builder.Services.AddOpenApi();

var app = builder.Build();

// ============================================================
// 7. Middleware pipeline
// ============================================================
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Serve uploaded audio files statically (replace NestJS ServeStatic)
app.UseStaticFiles();

var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
if (!provider.Mappings.ContainsKey(".m4a"))
    provider.Mappings[".m4a"] = "audio/mp4";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    ContentTypeProvider = provider,
    ServeUnknownFileTypes = true
});
var frontendPath = Path.Combine(Directory.GetCurrentDirectory(), "frontend");
if (Directory.Exists(frontendPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendPath),
        RequestPath = ""
    });
}

app.MapControllers();

// SignalR Hub - Frontend kết nối tới /ws/alerts
// (tương đương namespace '/ws/alerts' của Socket.IO trong NestJS)
app.MapHub<AlertHub>("/ws/alerts");

app.Run();
