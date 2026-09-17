using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVPhienBanConfiguration : IEntityTypeConfiguration<CVPhienBan>
{
    public void Configure(EntityTypeBuilder<CVPhienBan> builder)
    {
        builder.ToTable("CVPhienBan");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TemplateId).HasMaxLength(100);
        builder.HasIndex(x => new { x.CVUngVienId, x.SoPhienBan }).IsUnique();
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.PhienBans)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.TepGoc)
            .WithMany()
            .HasForeignKey(x => x.TepGocId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.TepDaSinh)
            .WithMany()
            .HasForeignKey(x => x.TepDaSinhId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
