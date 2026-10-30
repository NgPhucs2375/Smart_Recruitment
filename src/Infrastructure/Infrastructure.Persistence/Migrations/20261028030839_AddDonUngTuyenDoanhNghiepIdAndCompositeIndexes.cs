using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDonUngTuyenDoanhNghiepIdAndCompositeIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DoanhNghiepId",
                table: "DonUngTuyen",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE "DonUngTuyen" d
                SET "DoanhNghiepId" = t."DoanhNghiepId"
                FROM "TinTuyenDung" t
                WHERE d."TinTuyenDungId" = t."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_DoanhNghiepId_TrangThai",
                table: "DonUngTuyen",
                columns: new[] { "DoanhNghiepId", "TrangThai" });

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId_CVUngVienId",
                table: "DonUngTuyen",
                columns: new[] { "TinTuyenDungId", "CVUngVienId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DonUngTuyen_DoanhNghiepId_TrangThai",
                table: "DonUngTuyen");

            migrationBuilder.DropIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId_CVUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "DoanhNghiepId",
                table: "DonUngTuyen");
        }
    }
}
