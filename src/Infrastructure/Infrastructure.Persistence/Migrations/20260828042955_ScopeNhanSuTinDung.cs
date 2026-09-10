using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ScopeNhanSuTinDung : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TinTuyenDung_NguoiDangTinId",
                table: "TinTuyenDung",
                column: "NguoiDangTinId");

            migrationBuilder.AddForeignKey(
                name: "FK_TinTuyenDung_NguoiDung_NguoiDangTinId",
                table: "TinTuyenDung",
                column: "NguoiDangTinId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TinTuyenDung_NguoiDung_NguoiDangTinId",
                table: "TinTuyenDung");

            migrationBuilder.DropIndex(
                name: "IX_TinTuyenDung_NguoiDangTinId",
                table: "TinTuyenDung");
        }
    }
}
