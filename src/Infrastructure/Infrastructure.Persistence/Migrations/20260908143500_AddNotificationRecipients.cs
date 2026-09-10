using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Infrastructure.Persistence.Migrations;

public partial class AddNotificationRecipients : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Notifications",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                TieuDe = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                NoiDung = table.Column<string>(type: "text", nullable: false),
                LoaiThongBao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                ReferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                ReferenceId = table.Column<int>(type: "integer", nullable: true),
                CreatedBy = table.Column<string>(type: "text", nullable: true),
                Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Notifications", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "NotificationRecipients",
            columns: table => new
            {
                NotificationId = table.Column<int>(type: "integer", nullable: false),
                NguoiDungId = table.Column<int>(type: "integer", nullable: false),
                IsRead = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NotificationRecipients", x => new { x.NotificationId, x.NguoiDungId });
                table.ForeignKey(
                    name: "FK_NotificationRecipients_NguoiDung_NguoiDungId",
                    column: x => x.NguoiDungId,
                    principalTable: "NguoiDung",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_NotificationRecipients_Notifications_NotificationId",
                    column: x => x.NotificationId,
                    principalTable: "Notifications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_NotificationRecipients_NguoiDungId",
            table: "NotificationRecipients",
            column: "NguoiDungId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "NotificationRecipients");
        migrationBuilder.DropTable(name: "Notifications");
    }
}
