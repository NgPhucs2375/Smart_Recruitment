using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HardenDanhGiaUniqueReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Dọn bản trùng do race trước khi siết unique (giữ bản mới nhất theo Id).
            migrationBuilder.Sql("""
                DELETE FROM "DanhGia" a
                USING "DanhGia" b
                WHERE a."DonUngTuyenId" = b."DonUngTuyenId" AND a."Id" < b."Id";
                """);

            migrationBuilder.DropIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia");

            migrationBuilder.CreateIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia",
                column: "DonUngTuyenId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia");

            migrationBuilder.CreateIndex(
                name: "IX_DanhGia_DonUngTuyenId",
                table: "DanhGia",
                column: "DonUngTuyenId");
        }
    }
}
