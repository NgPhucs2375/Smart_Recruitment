using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RequireManualAdminApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "KetQuaSangLoc",
                table: "TinTuyenDung",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "NguoiDaiDienDaDuyet",
                table: "TinTuyenDung",
                type: "boolean",
                nullable: false,
                defaultValue: false);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "KetQuaSangLoc",
                table: "TinTuyenDung");

            migrationBuilder.DropColumn(
                name: "NguoiDaiDienDaDuyet",
                table: "TinTuyenDung");
        }
    }
}
