using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Identity.Migrations;

[DbContext(typeof(IdentityContext))]
[Migration("20261120090000_GrantEmployerSkillDictionaryCreate")]
public class GrantEmployerSkillDictionaryCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Nhà tuyển dụng cần thêm kỹ năng mới ngay trong form đăng tin khi từ điển
        // chưa có (VD: công nghệ mới). Chỉ cấp thêm "create" cho 2 role tuyển dụng;
        // sửa/xóa từ điển vẫn là việc của quản trị viên. Idempotent: chạy lại không
        // nhân đôi action, và grant bị admin gỡ sau này không bị bơm lại.
        migrationBuilder.Sql("""
            UPDATE "Identity"."RoleClaims" AS c
            SET "ClaimValue" = c."ClaimValue" || '#create'
            FROM "Identity"."Role" AS r
            WHERE c."RoleId" = r."Id"
              AND c."ClaimType" = 'kynangs'
              AND r."Name" IN ('NHAN_SU', 'NGUOI_DAI_DIEN')
              AND c."ClaimValue" NOT LIKE '%create%';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Preserve administrator-managed grants on rollback. There is no
        // reliable way to distinguish a bootstrap grant from a later edit.
    }
}
