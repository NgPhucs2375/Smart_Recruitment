using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCvImportAndVersioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CVPhienBanId",
                table: "DonUngTuyen",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CVImportSession",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HoSoUngVienId = table.Column<int>(type: "integer", nullable: false),
                    NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                    OriginalObjectKey = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OriginalContentType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OriginalFileSize = table.Column<long>(type: "bigint", nullable: false),
                    TrangThai = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CVUngVienId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CVImportSession", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CVImportSession_CVUngVien_CVUngVienId",
                        column: x => x.CVUngVienId,
                        principalTable: "CVUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CVImportSession_HoSoUngVien_HoSoUngVienId",
                        column: x => x.HoSoUngVienId,
                        principalTable: "HoSoUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CVTepTin",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CVUngVienId = table.Column<int>(type: "integer", nullable: false),
                    LoaiTep = table.Column<int>(type: "integer", nullable: false),
                    ObjectKey = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    TenFile = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    KichThuoc = table.Column<long>(type: "bigint", nullable: false),
                    Sha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CVTepTin", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CVTepTin_CVUngVien_CVUngVienId",
                        column: x => x.CVUngVienId,
                        principalTable: "CVUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CVPhienBan",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CVUngVienId = table.Column<int>(type: "integer", nullable: false),
                    SoPhienBan = table.Column<int>(type: "integer", nullable: false),
                    TepGocId = table.Column<int>(type: "integer", nullable: true),
                    TepDaSinhId = table.Column<int>(type: "integer", nullable: false),
                    TemplateId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CVPhienBan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CVPhienBan_CVTepTin_TepDaSinhId",
                        column: x => x.TepDaSinhId,
                        principalTable: "CVTepTin",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CVPhienBan_CVTepTin_TepGocId",
                        column: x => x.TepGocId,
                        principalTable: "CVTepTin",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CVPhienBan_CVUngVien_CVUngVienId",
                        column: x => x.CVUngVienId,
                        principalTable: "CVUngVien",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DonUngTuyen_CVPhienBanId",
                table: "DonUngTuyen",
                column: "CVPhienBanId");

            migrationBuilder.CreateIndex(
                name: "IX_CVImportSession_CVUngVienId",
                table: "CVImportSession",
                column: "CVUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_CVImportSession_HoSoUngVienId",
                table: "CVImportSession",
                column: "HoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_CVImportSession_NguoiDungId_TrangThai_ExpiresAt",
                table: "CVImportSession",
                columns: new[] { "NguoiDungId", "TrangThai", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CVPhienBan_CVUngVienId_SoPhienBan",
                table: "CVPhienBan",
                columns: new[] { "CVUngVienId", "SoPhienBan" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CVPhienBan_TepDaSinhId",
                table: "CVPhienBan",
                column: "TepDaSinhId");

            migrationBuilder.CreateIndex(
                name: "IX_CVPhienBan_TepGocId",
                table: "CVPhienBan",
                column: "TepGocId");

            migrationBuilder.CreateIndex(
                name: "IX_CVTepTin_CVUngVienId_LoaiTep",
                table: "CVTepTin",
                columns: new[] { "CVUngVienId", "LoaiTep" });

            migrationBuilder.CreateIndex(
                name: "IX_CVTepTin_ObjectKey",
                table: "CVTepTin",
                column: "ObjectKey",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_DonUngTuyen_CVPhienBan_CVPhienBanId",
                table: "DonUngTuyen",
                column: "CVPhienBanId",
                principalTable: "CVPhienBan",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DonUngTuyen_CVPhienBan_CVPhienBanId",
                table: "DonUngTuyen");

            migrationBuilder.DropTable(
                name: "CVImportSession");

            migrationBuilder.DropTable(
                name: "CVPhienBan");

            migrationBuilder.DropTable(
                name: "CVTepTin");

            migrationBuilder.DropIndex(
                name: "IX_DonUngTuyen_CVPhienBanId",
                table: "DonUngTuyen");

            migrationBuilder.DropColumn(
                name: "CVPhienBanId",
                table: "DonUngTuyen");
        }
    }
}
