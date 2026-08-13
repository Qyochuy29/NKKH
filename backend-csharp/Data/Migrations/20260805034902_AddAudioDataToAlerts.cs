using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolGuardian.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAudioDataToAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "audio_data",
                table: "alerts",
                type: "bytea",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "audio_data",
                table: "alerts");
        }
    }
}
