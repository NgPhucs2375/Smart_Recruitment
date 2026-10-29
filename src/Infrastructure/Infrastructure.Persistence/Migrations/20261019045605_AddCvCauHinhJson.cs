using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCvCauHinhJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CauHinhJson",
                table: "CVUngVien",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CauHinhJson",
                table: "CVPhienBan",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CauHinhJson",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "CauHinhJson",
                table: "CVPhienBan");
        }
    }
}
