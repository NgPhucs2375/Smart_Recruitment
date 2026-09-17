using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVImportSessionConfiguration : IEntityTypeConfiguration<CVImportSession>
{
    public void Configure(EntityTypeBuilder<CVImportSession> builder)
    {
        builder.ToTable("CVImportSession");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OriginalObjectKey).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.OriginalFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.OriginalContentType).IsRequired().HasMaxLength(255);
        builder.HasIndex(x => new { x.NguoiDungId, x.TrangThai, x.ExpiresAt });
        builder.HasOne(x => x.HoSoUngVien)
            .WithMany()
            .HasForeignKey(x => x.HoSoUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.CVUngVien)
            .WithMany()
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
