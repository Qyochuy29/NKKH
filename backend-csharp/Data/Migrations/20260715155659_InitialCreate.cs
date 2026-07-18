using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolGuardian.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:alert_status", "pending,confirmed,false_alarm,resolved")
                .Annotation("Npgsql:Enum:device_status", "online,offline,error")
                .Annotation("Npgsql:Enum:role", "admin,ban_giam_hieu,giam_thi,bao_ve")
                .Annotation("Npgsql:Enum:sound_type", "scream,help,threat,argument");

            migrationBuilder.CreateTable(
                name: "areas",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_areas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "settings",
                columns: table => new
                {
                    key = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_settings", x => x.key);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "devices",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    area_id = table.Column<string>(type: "text", nullable: false),
                    floor = table.Column<int>(type: "integer", nullable: false),
                    position_x = table.Column<double>(type: "double precision", nullable: false),
                    position_y = table.Column<double>(type: "double precision", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    battery_level = table.Column<int>(type: "integer", nullable: false),
                    last_seen = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_devices", x => x.id);
                    table.ForeignKey(
                        name: "FK_devices_areas_area_id",
                        column: x => x.area_id,
                        principalTable: "areas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "alerts",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    device_id = table.Column<string>(type: "text", nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    sound_type = table.Column<int>(type: "integer", nullable: false),
                    confidence_score = table.Column<double>(type: "double precision", nullable: false),
                    audio_file_url = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    handled_by_id = table.Column<string>(type: "text", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_evidence = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alerts", x => x.id);
                    table.ForeignKey(
                        name: "FK_alerts_devices_device_id",
                        column: x => x.device_id,
                        principalTable: "devices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alerts_users_handled_by_id",
                        column: x => x.handled_by_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "alert_logs",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    alert_id = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    actor_id = table.Column<string>(type: "text", nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_alert_logs_alerts_alert_id",
                        column: x => x.alert_id,
                        principalTable: "alerts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alert_logs_users_actor_id",
                        column: x => x.actor_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alert_logs_actor_id",
                table: "alert_logs",
                column: "actor_id");

            migrationBuilder.CreateIndex(
                name: "IX_alert_logs_alert_id",
                table: "alert_logs",
                column: "alert_id");

            migrationBuilder.CreateIndex(
                name: "IX_alerts_device_id",
                table: "alerts",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "IX_alerts_handled_by_id",
                table: "alerts",
                column: "handled_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_areas_name",
                table: "areas",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_devices_area_id",
                table: "devices",
                column: "area_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alert_logs");

            migrationBuilder.DropTable(
                name: "settings");

            migrationBuilder.DropTable(
                name: "alerts");

            migrationBuilder.DropTable(
                name: "devices");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "areas");
        }
    }
}
