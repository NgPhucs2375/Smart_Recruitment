using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Identity.Migrations
{
    /// <inheritdoc />
    public partial class BootstrapBaoCaoPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // One-time feature bootstrap for existing roles. Future restarts must
            // not recreate a grant intentionally removed by an administrator.
            migrationBuilder.Sql("""
                INSERT INTO "Identity"."RoleClaims" ("RoleId", "ClaimType", "ClaimValue")
                SELECT r."Id", 'baocao', 'show'
                FROM "Identity"."Role" r
                WHERE r."Name" IN ('QUAN_TRI_VIEN', 'NGUOI_DAI_DIEN', 'NHAN_SU')
                  AND NOT EXISTS (
                    SELECT 1 FROM "Identity"."RoleClaims" c
                    WHERE c."RoleId" = r."Id" AND c."ClaimType" = 'baocao'
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Preserve administrator-managed grants on rollback. There is no
            // reliable way to distinguish a bootstrap grant from a later edit.
        }
    }
}
