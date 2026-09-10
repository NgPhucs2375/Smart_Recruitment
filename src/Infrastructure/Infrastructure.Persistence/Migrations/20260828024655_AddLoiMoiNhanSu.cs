using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLoiMoiNhanSu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NgayDanhGia",
                table: "KetQuaPhuHop");

            migrationBuilder.DropColumn(
                name: "NgayPhanTich",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "NguoiDaiDien",
                table: "DoanhNghiep");

            migrationBuilder.AddColumn<int>(
                name: "NguoiDangTinId",
                table: "TinTuyenDung",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "HinhThuc",
                table: "LichPhongVan",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MucDoThongThao",
                table: "KyNangUngVien",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.DropColumn(
                name: "MucDoYeuCau",
                table: "KyNangTinTuyenDung");

            migrationBuilder.AddColumn<int>(
                name: "MucDoYeuCau",
                table: "KyNangTinTuyenDung",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "KetQuaPhuHop",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KyNangThieu",
                table: "KetQuaPhuHop",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KyNangThoa",
                table: "KetQuaPhuHop",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HocVanTrichXuat",
                table: "KetQuaPhanTichCv",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsTimViec",
                table: "HoSoUngVien",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "MucLuongMongMuon",
                table: "HoSoUngVien",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "ViTriUngTuyen",
                table: "HoSoUngVien",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GhiChu",
                table: "DonUngTuyen",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NguoiXuLyId",
                table: "DonUngTuyen",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "DanhMucNghe",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TrangThaiCV",
                table: "CVUngVien",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "LoiMoiNhanSu",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoanhNghiepId = table.Column<int>(type: "integer", nullable: false),
                    NguoiDaiDienId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    HoTen = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ChucVu = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LoiMoi = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NgayHetHan = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoiMoiNhanSu", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoiMoiNhanSu_DoanhNghiep_DoanhNghiepId",
                        column: x => x.DoanhNghiepId,
                        principalTable: "DoanhNghiep",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LoiMoiNhanSu_NguoiDung_NguoiDaiDienId",
                        column: x => x.NguoiDaiDienId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoiMoiNhanSu_DoanhNghiepId",
                table: "LoiMoiNhanSu",
                column: "DoanhNghiepId");

            migrationBuilder.CreateIndex(
                name: "IX_LoiMoiNhanSu_NguoiDaiDienId",
                table: "LoiMoiNhanSu",
                column: "NguoiDaiDienId");

            migrationBuilder.CreateIndex(
                name: "IX_LoiMoiNhanSu_Token",
                table: "LoiMoiNhanSu",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoiMoiNhanSu");

            migrationBuilder.DropColumn(
                name: "NguoiDangTinId",
                table: "TinTuyenDung");

            migrationBuilder.DropColumn(
                name: "HinhThuc",
                table: "LichPhongVan");

            migrationBuilder.DropColumn(
                name: "MucDoThongThao",
                table: "KyNangUngVien");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "KetQuaPhuHop");

            migrationBuilder.DropColumn(
                name: "KyNangThieu",
                table: "KetQuaPhuHop");

            migrationBuilder.DropColumn(
                name: "KyNangThoa",
                table: "KetQuaPhuHop");

            migrationBuilder.DropColumn(
                name: "HocVanTrichXuat",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "IsTimViec",
                table: "HoSoUngVien");

            migrationBuilder.DropColumn(
                name: "MucLuongMongMuon",
                table: "HoSoUngVien");

            migrationBuilder.DropColumn(
                name: "ViTriUngTuyen",
                table: "HoSoUngVien");

            migrationBuilder.DropColumn(
                name: "GhiChu",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "NguoiXuLyId",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "DanhMucNghe");

            migrationBuilder.DropColumn(
                name: "TrangThaiCV",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "MucDoYeuCau",
                table: "KyNangTinTuyenDung");

            migrationBuilder.AddColumn<string>(
                name: "MucDoYeuCau",
                table: "KyNangTinTuyenDung",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayDanhGia",
                table: "KetQuaPhuHop",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayPhanTich",
                table: "KetQuaPhanTichCv",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NguoiDaiDien",
                table: "DoanhNghiep",
                type: "text",
                nullable: true);
        }
    }
}
