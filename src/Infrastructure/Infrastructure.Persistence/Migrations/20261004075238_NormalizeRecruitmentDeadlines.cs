using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261004075238_NormalizeRecruitmentDeadlines")]
public class NormalizeRecruitmentDeadlines : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        UPDATE "TinTuyenDung"
        SET "NgayHetHan" = "NgayHetHan" + INTERVAL '17 hours'
        WHERE "NgayHetHan" IS NOT NULL
          AND ("NgayHetHan" AT TIME ZONE 'UTC')::time = TIME '00:00:00';
        """);

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        UPDATE "TinTuyenDung"
        SET "NgayHetHan" = "NgayHetHan" - INTERVAL '17 hours'
        WHERE "NgayHetHan" IS NOT NULL
          AND ("NgayHetHan" AT TIME ZONE 'UTC')::time = TIME '17:00:00';
        """);
}
