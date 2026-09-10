using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "linhVucHoatDong",
                table: "doanhNghiep",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "maSoThue",
                table: "doanhNghiep",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nguoiDaiDien",
                table: "doanhNghiep",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "quyMoNhanSu",
                table: "doanhNghiep",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "linhVucHoatDong",
                table: "doanhNghiep");

            migrationBuilder.DropColumn(
                name: "maSoThue",
                table: "doanhNghiep");

            migrationBuilder.DropColumn(
                name: "nguoiDaiDien",
                table: "doanhNghiep");

            migrationBuilder.DropColumn(
                name: "quyMoNhanSu",
                table: "doanhNghiep");
        }
    }
}
