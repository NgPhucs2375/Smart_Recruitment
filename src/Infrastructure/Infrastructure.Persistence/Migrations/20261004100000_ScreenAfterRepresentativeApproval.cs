using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261004100000_ScreenAfterRepresentativeApproval")]
public class ScreenAfterRepresentativeApproval : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        UPDATE "TinTuyenDung" t
        SET "TrangThai" = CASE
                WHEN n."VaiTro" = 'NHAN_SU' AND NOT t."NguoiDaiDienDaDuyet"
                THEN 'ChoNguoiDaiDienDuyet'
                ELSE 'ChoDuyetHeThong' END,
            "KetQuaSangLoc" = '', "LastModified" = CURRENT_TIMESTAMP
        FROM "NguoiDung" n
        WHERE t."NguoiDangTinId" = n."Id"
          AND t."TrangThai" IN ('ChoAdminDuyet', 'ChoDuyetHeThong');

        UPDATE "TinTuyenDung"
        SET "KetQuaSangLoc" = '', "LastModified" = CURRENT_TIMESTAMP
        WHERE "TrangThai" = 'ChoNguoiDaiDienDuyet';
        """);

    protected override void Down(MigrationBuilder migrationBuilder) { }
}
