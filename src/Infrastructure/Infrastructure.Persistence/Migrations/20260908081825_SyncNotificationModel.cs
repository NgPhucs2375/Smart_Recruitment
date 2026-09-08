using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncNotificationModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LichPhongVan");

            migrationBuilder.DropTable(
                name: "ThongBao");

            migrationBuilder.AddColumn<int>(
                name: "PhanTich",
                table: "KetQuaPhanTichCv",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NguoiDaiDienId",
                table: "DoanhNghiep",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoiChiTiet",
                table: "CVUngVien",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhuongThucTaoCV",
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

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    NoiDung = table.Column<string>(type: "text", nullable: false),
                    LoaiThongBao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ReferenceId = table.Column<int>(type: "integer", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationRecipients",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "integer", nullable: false),
                    NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRecipients", x => new { x.NotificationId, x.NguoiDungId });
                    table.ForeignKey(
                        name: "FK_NotificationRecipients_NguoiDung_NguoiDungId",
                        column: x => x.NguoiDungId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationRecipients_Notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalTable: "Notifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoanhNghiep_MaSoThue",
                table: "DoanhNghiep",
                column: "MaSoThue",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoanhNghiep_NguoiDaiDienId",
                table: "DoanhNghiep",
                column: "NguoiDaiDienId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipients_NguoiDungId",
                table: "NotificationRecipients",
                column: "NguoiDungId");

            migrationBuilder.AddForeignKey(
                name: "FK_DoanhNghiep_NguoiDung_NguoiDaiDienId",
                table: "DoanhNghiep",
                column: "NguoiDaiDienId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DoanhNghiep_NguoiDung_NguoiDaiDienId",
                table: "DoanhNghiep");

            migrationBuilder.DropTable(
                name: "NotificationRecipients");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_DoanhNghiep_MaSoThue",
                table: "DoanhNghiep");

            migrationBuilder.DropIndex(
                name: "IX_DoanhNghiep_NguoiDaiDienId",
                table: "DoanhNghiep");

            migrationBuilder.DropColumn(
                name: "PhanTich",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "NguoiDaiDienId",
                table: "DoanhNghiep");

            migrationBuilder.DropColumn(
                name: "LoiChiTiet",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "PhuongThucTaoCV",
                table: "CVUngVien");

            migrationBuilder.DropColumn(
                name: "TrangThaiTienTrinhCV",
                table: "CVUngVien");

            migrationBuilder.CreateTable(
                name: "LichPhongVan",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DonUngTuyenId = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    DiaDiem = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    GhiChu = table.Column<string>(type: "text", nullable: true),
                    HinhThuc = table.Column<int>(type: "integer", nullable: false),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    ThoiGianPhongVan = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TrangThai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LichPhongVan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LichPhongVan_DonUngTuyen_DonUngTuyenId",
                        column: x => x.DonUngTuyenId,
                        principalTable: "DonUngTuyen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ThongBao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LoaiThongBao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NoiDung = table.Column<string>(type: "text", nullable: false),
                    TieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThongBao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ThongBao_NguoiDung_NguoiDungId",
                        column: x => x.NguoiDungId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LichPhongVan_DonUngTuyenId",
                table: "LichPhongVan",
                column: "DonUngTuyenId");

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_NguoiDungId",
                table: "ThongBao",
                column: "NguoiDungId");
        }
    }
}
