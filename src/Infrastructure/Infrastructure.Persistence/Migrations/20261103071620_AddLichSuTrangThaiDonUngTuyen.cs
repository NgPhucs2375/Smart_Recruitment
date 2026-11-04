using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLichSuTrangThaiDonUngTuyen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LichSuTrangThaiDonUngTuyen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DonUngTuyenId = table.Column<int>(type: "integer", nullable: false),
                    TrangThaiTruoc = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TrangThaiSau = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Trigger = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NguoiThucHienId = table.Column<int>(type: "integer", nullable: true),
                    GhiChu = table.Column<string>(type: "text", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LichSuTrangThaiDonUngTuyen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LichSuTrangThaiDonUngTuyen_DonUngTuyen_DonUngTuyenId",
                        column: x => x.DonUngTuyenId,
                        principalTable: "DonUngTuyen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LichSuTrangThaiDonUngTuyen_NguoiDung_NguoiThucHienId",
                        column: x => x.NguoiThucHienId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LichSuTrangThaiDonUngTuyen_DonUngTuyenId_Created",
                table: "LichSuTrangThaiDonUngTuyen",
                columns: new[] { "DonUngTuyenId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_LichSuTrangThaiDonUngTuyen_NguoiThucHienId",
                table: "LichSuTrangThaiDonUngTuyen",
                column: "NguoiThucHienId");

            // Dòng mốc cho các đơn đã tồn tại trước khi bật vệt kiểm toán, để timeline
            // không trống trơn. Trigger để NULL: đây không phải một chuyển trạng thái
            // quan sát được, UI phải hiển thị là "mốc ban đầu" chứ không bịa nguyên nhân.
            migrationBuilder.Sql(@"
                INSERT INTO ""LichSuTrangThaiDonUngTuyen""
                    (""DonUngTuyenId"", ""TrangThaiTruoc"", ""TrangThaiSau"", ""Trigger"", ""GhiChu"", ""Created"", ""CreatedBy"")
                SELECT d.""Id"", d.""TrangThai"", d.""TrangThai"", NULL,
                       'Dòng mốc trạng thái trước khi bật vệt kiểm toán.',
                       d.""Created"", 'system'
                FROM ""DonUngTuyen"" d
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""LichSuTrangThaiDonUngTuyen"" h WHERE h.""DonUngTuyenId"" = d.""Id"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LichSuTrangThaiDonUngTuyen");
        }
    }
}
