using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuatUngVienFanout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId",
                table: "KetQuaPhuHop");

            migrationBuilder.DropIndex(
                name: "IX_KetQuaPhuHop_TinTuyenDungId",
                table: "KetQuaPhuHop");

            migrationBuilder.AddColumn<DateTime>(
                name: "QuatUngVienLucCuoi",
                table: "TinTuyenDung",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVien_CV_Tin",
                table: "KetQuaPhuHop",
                columns: new[] { "HoSoUngVienId", "CVUngVienId", "TinTuyenDungId" },
                unique: true);
            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_Tin_Diem",
                table: "KetQuaPhuHop",
                columns: new[] { "TinTuyenDungId", "DiemPhuHop" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVien_CV_Tin",
                table: "KetQuaPhuHop");

            migrationBuilder.DropIndex(
                name: "IX_KetQuaPhuHop_Tin_Diem",
                table: "KetQuaPhuHop");

            migrationBuilder.DropColumn(
                name: "QuatUngVienLucCuoi",
                table: "TinTuyenDung");

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_HoSoUngVienId",
                table: "KetQuaPhuHop",
                column: "HoSoUngVienId");

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhuHop_TinTuyenDungId",
                table: "KetQuaPhuHop",
                column: "TinTuyenDungId");
        }
    }
}
