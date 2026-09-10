using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LinkNguoiDungToIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_nguoiDung_Email",
                table: "nguoiDung");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "nguoiDung");

            migrationBuilder.DropColumn(
                name: "matKhau",
                table: "nguoiDung");

            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "nguoiDung",
                type: "character varying(450)",
                maxLength: 450,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_nguoiDung_ApplicationUserId",
                table: "nguoiDung",
                column: "ApplicationUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_nguoiDung_ApplicationUserId",
                table: "nguoiDung");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "nguoiDung");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "nguoiDung",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "matKhau",
                table: "nguoiDung",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_nguoiDung_Email",
                table: "nguoiDung",
                column: "Email",
                unique: true);
        }
    }
}
