using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    public partial class ReorderDonUngTuyenStatuses : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"DonUngTuyen\" SET \"TrangThai\" = CASE \"TrangThai\" WHEN 4 THEN 5 WHEN 5 THEN 6 WHEN 6 THEN 4 ELSE \"TrangThai\" END WHERE \"TrangThai\" IN (4, 5, 6);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"DonUngTuyen\" SET \"TrangThai\" = CASE \"TrangThai\" WHEN 4 THEN 6 WHEN 5 THEN 4 WHEN 6 THEN 5 ELSE \"TrangThai\" END WHERE \"TrangThai\" IN (4, 5, 6);");
        }
    }
}
