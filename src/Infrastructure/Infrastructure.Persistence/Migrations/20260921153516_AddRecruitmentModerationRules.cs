using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRecruitmentModerationRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuyTacKiemDuyetTin",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TuKhoa = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Loai = table.Column<int>(type: "integer", nullable: false),
                    DiemTru = table.Column<int>(type: "integer", nullable: false),
                    MoTa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuyTacKiemDuyetTin", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "QuyTacKiemDuyetTin",
                columns: new[] { "Id", "Created", "CreatedBy", "DiemTru", "IsActive", "LastModified", "LastModifiedBy", "Loai", "MoTa", "TuKhoa" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Dấu hiệu lừa đảo", "viec nhe luong cao" },
                    { 2, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Yêu cầu đặt cọc", "dat coc" },
                    { 3, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Thu phí ứng viên", "phi tham gia" },
                    { 4, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Thu phí ứng viên", "phi giu cho" },
                    { 5, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Thu phí ứng viên", "phi dao tao" },
                    { 6, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Thu phí ứng viên", "phi ho so" },
                    { 7, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Thu phí ứng viên", "phi tuyen dung" },
                    { 8, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Yêu cầu chuyển tiền", "nop tien truoc" },
                    { 9, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Yêu cầu chuyển tiền", "chuyen tien truoc" },
                    { 10, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "chi tuyen nam" },
                    { 11, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "chi tuyen nu" },
                    { 12, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 25, true, null, null, 2, "Cam kết thu nhập phi thực tế", "thu nhap khong gioi han" },
                    { 13, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 25, true, null, null, 2, "Cam kết làm giàu", "co hoi lam giau" },
                    { 14, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 25, true, null, null, 2, "Cam kết thu nhập phi thực tế", "kiem tien nhanh" },
                    { 15, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 25, true, null, null, 2, "Dấu hiệu tuyển dụng không rõ ràng", "kiem tien online" },
                    { 16, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 15, true, null, null, 2, "Thiếu cam kết lao động", "khong can hop dong" },
                    { 17, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 15, true, null, null, 2, "Quy trình tuyển dụng rủi ro", "khong can cv" },
                    { 18, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Thu phí ứng viên", "phi nhap hoc" },
                    { 19, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Mô hình kim tự tháp", "pyramid scheme" },
                    { 20, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Dấu hiệu đa cấp", "multi level marketing" },
                    { 21, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "chi nhan nam" },
                    { 22, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "chi nhan nu" },
                    { 23, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "khong nhan nam" },
                    { 24, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "khong nhan nu" },
                    { 25, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "khong tuyen nam" },
                    { 26, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "khong tuyen nu" },
                    { 27, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 100, true, null, null, 1, "Phân biệt giới tính", "khong tuyen phu nu" },
                    { 28, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 15, true, null, null, 2, "Cam kết thanh toán phi thực tế", "nhan tien ngay" },
                    { 29, new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "system", 15, true, null, null, 2, "Cam kết thanh toán phi thực tế", "tra tien ngay" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuyTacKiemDuyetTin_TuKhoa_Loai",
                table: "QuyTacKiemDuyetTin",
                columns: new[] { "TuKhoa", "Loai" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuyTacKiemDuyetTin");
        }
    }
}
