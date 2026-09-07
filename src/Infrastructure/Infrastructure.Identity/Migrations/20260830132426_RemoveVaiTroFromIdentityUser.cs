using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Identity.Migrations
{
    /// <inheritdoc />
    public partial class RemoveVaiTroFromIdentityUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // vaiTro từng được thêm bởi migration UpdateIdentityContext (nay đã xóa khỏi lịch sử).
            // Dùng IF EXISTS để an toàn cho cả DB cũ (có cột) và DB mới (chưa từng có cột).
            migrationBuilder.Sql(@"ALTER TABLE ""Identity"".""User"" DROP COLUMN IF EXISTS ""vaiTro"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Identity"".""User"" ADD COLUMN IF NOT EXISTS ""vaiTro"" integer NOT NULL DEFAULT 0;");
        }
    }
}
