using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDirectChatParticipants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParticipantOneId",
                table: "Conversations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParticipantTwoId",
                table: "Conversations",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_DoanhNghiepId_ParticipantOneId_ParticipantTwo~",
                table: "Conversations",
                columns: new[] { "DoanhNghiepId", "ParticipantOneId", "ParticipantTwoId" },
                unique: true,
                filter: "\"Type\" = 0 AND \"ParticipantOneId\" IS NOT NULL AND \"ParticipantTwoId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Conversations_DoanhNghiepId_ParticipantOneId_ParticipantTwo~",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ParticipantOneId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ParticipantTwoId",
                table: "Conversations");
        }
    }
}
