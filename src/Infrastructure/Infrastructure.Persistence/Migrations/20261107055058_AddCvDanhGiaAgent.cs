using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCvDanhGiaAgent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DaDanhGiaBangAi",
                table: "KetQuaPhanTichCv",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DanhGiaLuc",
                table: "KetQuaPhanTichCv",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiemManh",
                table: "KetQuaPhanTichCv",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "DiemPhuHop",
                table: "KetQuaPhanTichCv",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DiemTongQuan",
                table: "KetQuaPhanTichCv",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiemYeu",
                table: "KetQuaPhanTichCv",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoiY",
                table: "KetQuaPhanTichCv",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MatchingVersion",
                table: "KetQuaPhanTichCv",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NhanXet",
                table: "KetQuaPhanTichCv",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TinTuyenDungId",
                table: "KetQuaPhanTichCv",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_KetQuaPhanTichCv_TinTuyenDungId",
                table: "KetQuaPhanTichCv",
                column: "TinTuyenDungId");

            migrationBuilder.AddForeignKey(
                name: "FK_KetQuaPhanTichCv_TinTuyenDung_TinTuyenDungId",
                table: "KetQuaPhanTichCv",
                column: "TinTuyenDungId",
                principalTable: "TinTuyenDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KetQuaPhanTichCv_TinTuyenDung_TinTuyenDungId",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropIndex(
                name: "IX_KetQuaPhanTichCv_TinTuyenDungId",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "DaDanhGiaBangAi",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "DanhGiaLuc",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "DiemManh",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "DiemPhuHop",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "DiemTongQuan",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "DiemYeu",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "GoiY",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "MatchingVersion",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "NhanXet",
                table: "KetQuaPhanTichCv");

            migrationBuilder.DropColumn(
                name: "TinTuyenDungId",
                table: "KetQuaPhanTichCv");
        }
    }
}
