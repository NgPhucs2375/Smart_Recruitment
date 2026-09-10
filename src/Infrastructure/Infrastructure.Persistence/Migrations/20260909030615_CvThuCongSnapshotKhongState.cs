using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CvThuCongSnapshotKhongState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhuongThucTaoCV",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "TrangThaiCV",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "TrangThaiTienTrinhCV",
                table: "CVUngVien");

            migrationBuilder.RenameColumn(
                name: "LoiChiTiet",
                table: "CVUngVien",
                newName: "TemplateId");

            migrationBuilder.AlterColumn<string>(
                name: "TenFile",
                table: "CVUngVien",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "FileUrl",
                table: "CVUngVien",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<bool>(
                name: "IsDaXoa",
                table: "CVUngVien",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "NoiDungJson",
                table: "CVUngVien",
                type: "jsonb",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDaXoa",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "NoiDungJson",
                table: "CVUngVien");

            migrationBuilder.RenameColumn(
                name: "TemplateId",
                table: "CVUngVien",
                newName: "LoiChiTiet");

            migrationBuilder.AlterColumn<string>(
                name: "TenFile",
                table: "CVUngVien",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FileUrl",
                table: "CVUngVien",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhuongThucTaoCV",
                table: "CVUngVien",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TrangThaiCV",
                table: "CVUngVien",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TrangThaiTienTrinhCV",
                table: "CVUngVien",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
