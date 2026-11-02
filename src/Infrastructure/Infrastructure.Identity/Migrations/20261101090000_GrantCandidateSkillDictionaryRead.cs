using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Identity.Migrations;

[DbContext(typeof(IdentityContext))]
[Migration("20261101090000_GrantCandidateSkillDictionaryRead")]
public class GrantCandidateSkillDictionaryRead : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // UNG_VIEN là role duy nhất thiếu quyền đọc từ điển kỹ năng, trong khi màn
        // "Kỹ năng của tôi" trên mobile phải tìm kỹ năng trong từ điển để thêm vào hồ sơ.
        // Chỉ đọc: tạo/sửa/xóa từ điển vẫn là việc của quản trị viên.
        migrationBuilder.Sql("""
            INSERT INTO "Identity"."RoleClaims" ("RoleId", "ClaimType", "ClaimValue")
            SELECT r."Id", 'kynangs', 'list#show'
            FROM "Identity"."Role" r
            WHERE r."Name" = 'UNG_VIEN'
              AND NOT EXISTS (
                SELECT 1 FROM "Identity"."RoleClaims" c
                WHERE c."RoleId" = r."Id" AND c."ClaimType" = 'kynangs'
              );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Preserve administrator-managed grants on rollback. There is no
        // reliable way to distinguish a bootstrap grant from a later edit.
    }
}
