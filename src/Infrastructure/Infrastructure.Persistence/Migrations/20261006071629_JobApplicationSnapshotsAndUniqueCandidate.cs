using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class JobApplicationSnapshotsAndUniqueCandidate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId",
                table: "DonUngTuyen");

            migrationBuilder.AddColumn<string>(
                name: "CvSnapshotJson",
                table: "DonUngTuyen",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HoSoUngVienId",
                table: "DonUngTuyen",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId_HoSoUngVienId",
                table: "DonUngTuyen",
                columns: new[] { "TinTuyenDungId", "HoSoUngVienId" },
                unique: true,
                filter: "\"HoSoUngVienId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId_HoSoUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "CvSnapshotJson",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "HoSoUngVienId",
                table: "DonUngTuyen");

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_TinTuyenDungId",
                table: "DonUngTuyen",
                column: "TinTuyenDungId");
        }
    }
}
