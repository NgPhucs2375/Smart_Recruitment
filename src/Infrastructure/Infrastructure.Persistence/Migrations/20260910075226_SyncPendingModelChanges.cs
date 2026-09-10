using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KinhNghiemLamViec");

            migrationBuilder.DropTable(
                name: "KyNangUngVien");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KinhNghiemLamViec",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    DenNgay = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DiaChi = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsHienTai = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    MoTa = table.Column<string>(type: "text", nullable: true),
                    TenCongTy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    TuNgay = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KinhNghiemLamViec", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KinhNghiemLamViec_HoSoUngVien_HoSoUngVienId",
                        column: x => x.HoSoUngVienId,
                        principalTable: "HoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KyNangUngVien",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    KyNangId = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    MucDoThongThao = table.Column<int>(type: "integer", nullable: false),
                    SoNamKinhNghiem = table.Column<float>(type: "real", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KyNangUngVien", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KyNangUngVien_HoSoUngVien_HoSoUngVienId",
                        column: x => x.HoSoUngVienId,
                        principalTable: "HoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KyNangUngVien_KyNang_KyNangId",
                        column: x => x.KyNangId,
                        principalTable: "KyNang",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KinhNghiemLamViec_HoSoUngVienId",
                table: "KinhNghiemLamViec",
                column: "HoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_KyNangUngVien_HoSoUngVienId",
                table: "KyNangUngVien",
                column: "HoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_KyNangUngVien_KyNangId",
                table: "KyNangUngVien",
                column: "KyNangId");
        }
    }
}
