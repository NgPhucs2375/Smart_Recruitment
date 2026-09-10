using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveHoSoUngVienIdFromDonUngTuyen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DonUngTuyen_HoSoUngVien_HoSoUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.DropIndex(
                name: "IX_DonUngTuyen_HoSoUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "HoSoUngVienId",
                table: "DonUngTuyen");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HoSoUngVienId",
                table: "DonUngTuyen",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_HoSoUngVienId",
                table: "DonUngTuyen",
                column: "HoSoUngVienId");

            migrationBuilder.AddForeignKey(
                name: "FK_DonUngTuyen_HoSoUngVien_HoSoUngVienId",
                table: "DonUngTuyen",
                column: "HoSoUngVienId",
                principalTable: "HoSoUngVien",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
