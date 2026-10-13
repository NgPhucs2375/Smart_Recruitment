using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Identity.Migrations
{
    /// <inheritdoc />
    public partial class BootstrapChatPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // One-time feature bootstrap for existing roles. Future restarts must
            // not recreate a grant intentionally removed by an administrator.
            migrationBuilder.Sql("""
                INSERT INTO "Identity"."RoleClaims" ("RoleId", "ClaimType", "ClaimValue")
                SELECT r."Id", 'chat', 'list#show#create#send'
                FROM "Identity"."Role" r
                WHERE r."Name" IN ('NHAN_SU', 'NGUOI_DAI_DIEN')
                  AND NOT EXISTS (
                    SELECT 1 FROM "Identity"."RoleClaims" c
                    WHERE c."RoleId" = r."Id" AND c."ClaimType" = 'chat'
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
