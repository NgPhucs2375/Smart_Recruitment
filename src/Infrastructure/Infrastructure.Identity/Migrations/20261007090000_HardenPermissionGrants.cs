using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Identity.Migrations;

[DbContext(typeof(IdentityContext))]
[Migration("20261007090000_HardenPermissionGrants")]
public class HardenPermissionGrants : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE "Identity"."RoleClaims" SET "ClaimType"=lower(btrim("ClaimType"));
            WITH merged AS (
                SELECT min("Id") AS id, string_agg(DISTINCT lower(btrim(a)), '#' ORDER BY lower(btrim(a))) AS actions
                FROM "Identity"."RoleClaims", unnest(string_to_array(coalesce("ClaimValue", ''), '#')) AS a
                WHERE btrim(a) <> '' GROUP BY "RoleId", "ClaimType"
            ) UPDATE "Identity"."RoleClaims" c SET "ClaimValue"=m.actions FROM merged m WHERE c."Id"=m.id;
            DELETE FROM "Identity"."RoleClaims" c USING "Identity"."RoleClaims" keep
                WHERE c."RoleId"=keep."RoleId" AND c."ClaimType"=keep."ClaimType" AND c."Id">keep."Id";
            DELETE FROM "Identity"."RoleClaims" c USING "Identity"."Role" r
                WHERE c."RoleId"=r."Id" AND r."Name" <> 'QUAN_TRI_VIEN'
                AND c."ClaimType" IN ('users','roles','roleclaims','nguoidungs','dashboard','quytackiemduyettins');
            UPDATE "Identity"."RoleClaims" c SET "ClaimValue"=(
                SELECT coalesce(string_agg(a, '#' ORDER BY a), '') FROM unnest(string_to_array(c."ClaimValue", '#')) a
                WHERE a NOT IN ('create','edit','delete')) FROM "Identity"."Role" r
                WHERE c."RoleId"=r."Id" AND r."Name"='UNG_VIEN' AND c."ClaimType"='danhgias';
            -- Initialize the previously missing download capability once, not on every restart.
            UPDATE "Identity"."RoleClaims" c SET "ClaimValue"=c."ClaimValue" || '#download'
                FROM "Identity"."Role" r WHERE c."RoleId"=r."Id" AND c."ClaimType"='cvungviens'
                AND r."Name" IN ('QUAN_TRI_VIEN','NGUOI_DAI_DIEN','NHAN_SU','UNG_VIEN')
                AND 'show'=ANY(string_to_array(c."ClaimValue", '#')) AND NOT 'download'=ANY(string_to_array(c."ClaimValue", '#'));
            """);
        migrationBuilder.CreateIndex(name: "IX_RoleClaims_RoleId_ClaimType", schema: "Identity", table: "RoleClaims",
            columns: new[] { "RoleId", "ClaimType" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropIndex(name: "IX_RoleClaims_RoleId_ClaimType", schema: "Identity", table: "RoleClaims");
}
