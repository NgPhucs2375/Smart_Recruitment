using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261124000000_RepairInvalidHrAdminQueue")]
public class RepairInvalidHrAdminQueue : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        UPDATE "TinTuyenDung" t
        SET "TrangThai" = 'ChoNguoiDaiDienDuyet', "KetQuaSangLoc" = '', "LastModified" = CURRENT_TIMESTAMP
        FROM "NguoiDung" n
        WHERE t."NguoiDangTinId" = n."Id"
          AND n."VaiTro" = 'NHAN_SU'
          AND t."TrangThai" = 'ChoAdminDuyet'
          AND NOT t."NguoiDaiDienDaDuyet";
        """);

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
