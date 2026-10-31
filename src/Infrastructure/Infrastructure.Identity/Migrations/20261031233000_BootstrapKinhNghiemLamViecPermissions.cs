using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Identity.Migrations;

[DbContext(typeof(IdentityContext))]
[Migration("20261031233000_BootstrapKinhNghiemLamViecPermissions")]
public class BootstrapKinhNghiemLamViecPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // One-time feature bootstrap: kinh nghiệm làm việc là dữ liệu riêng của hồ sơ
        // ứng viên nên chỉ UNG_VIEN (tự quản lý) và QUAN_TRI_VIEN được cấp quyền.
        // Restart sau này không tạo lại grant mà administrator đã chủ động gỡ.
        migrationBuilder.Sql("""
            INSERT INTO "Identity"."RoleClaims" ("RoleId", "ClaimType", "ClaimValue")
            SELECT r."Id", 'kinhnghiemlamviec', 'create#delete#edit#list'
            FROM "Identity"."Role" r
            WHERE r."Name" IN ('QUAN_TRI_VIEN', 'UNG_VIEN')
              AND NOT EXISTS (
                SELECT 1 FROM "Identity"."RoleClaims" c
                WHERE c."RoleId" = r."Id" AND c."ClaimType" = 'kinhnghiemlamviec'
              );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Preserve administrator-managed grants on rollback. There is no
        // reliable way to distinguish a bootstrap grant from a later edit.
    }
}
