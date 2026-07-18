using System;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolGuardian.Api.Models;

#nullable disable

namespace SchoolGuardian.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddParentAndStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:AlertStatus", "pending,confirmed,false_alarm,resolved")
                .Annotation("Npgsql:Enum:DeviceStatus", "online,offline,error")
                .Annotation("Npgsql:Enum:Role", "admin,ban_giam_hieu,giam_thi,bao_ve,phu_huynh")
                .Annotation("Npgsql:Enum:SoundType", "scream,help,threat,argument")
                .OldAnnotation("Npgsql:Enum:alert_status", "pending,confirmed,false_alarm,resolved")
                .OldAnnotation("Npgsql:Enum:device_status", "online,offline,error")
                .OldAnnotation("Npgsql:Enum:role", "admin,ban_giam_hieu,giam_thi,bao_ve")
                .OldAnnotation("Npgsql:Enum:sound_type", "scream,help,threat,argument");

            migrationBuilder.AlterColumn<Role>(
                name: "role",
                table: "users",
                type: "\"Role\"",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<DeviceStatus>(
                name: "status",
                table: "devices",
                type: "\"DeviceStatus\"",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<AlertStatus>(
                name: "status",
                table: "alerts",
                type: "\"AlertStatus\"",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<SoundType>(
                name: "sound_type",
                table: "alerts",
                type: "\"SoundType\"",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "students",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    parent_id = table.Column<string>(type: "text", nullable: false),
                    classroom_id = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_students", x => x.id);
                    table.ForeignKey(
                        name: "FK_students_areas_classroom_id",
                        column: x => x.classroom_id,
                        principalTable: "areas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_students_users_parent_id",
                        column: x => x.parent_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_settings_key",
                table: "settings",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_students_classroom_id",
                table: "students",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "IX_students_parent_id",
                table: "students",
                column: "parent_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "students");

            migrationBuilder.DropIndex(
                name: "IX_settings_key",
                table: "settings");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:alert_status", "pending,confirmed,false_alarm,resolved")
                .Annotation("Npgsql:Enum:device_status", "online,offline,error")
                .Annotation("Npgsql:Enum:role", "admin,ban_giam_hieu,giam_thi,bao_ve")
                .Annotation("Npgsql:Enum:sound_type", "scream,help,threat,argument")
                .OldAnnotation("Npgsql:Enum:AlertStatus", "pending,confirmed,false_alarm,resolved")
                .OldAnnotation("Npgsql:Enum:DeviceStatus", "online,offline,error")
                .OldAnnotation("Npgsql:Enum:Role", "admin,ban_giam_hieu,giam_thi,bao_ve,phu_huynh")
                .OldAnnotation("Npgsql:Enum:SoundType", "scream,help,threat,argument");

            migrationBuilder.AlterColumn<int>(
                name: "role",
                table: "users",
                type: "integer",
                nullable: false,
                oldClrType: typeof(Role),
                oldType: "\"Role\"");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "devices",
                type: "integer",
                nullable: false,
                oldClrType: typeof(DeviceStatus),
                oldType: "\"DeviceStatus\"");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "alerts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(AlertStatus),
                oldType: "\"AlertStatus\"");

            migrationBuilder.AlterColumn<int>(
                name: "sound_type",
                table: "alerts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(SoundType),
                oldType: "\"SoundType\"");
        }
    }
}
