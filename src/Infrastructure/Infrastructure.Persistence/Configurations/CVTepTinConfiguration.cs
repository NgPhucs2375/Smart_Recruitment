using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVTepTinConfiguration : IEntityTypeConfiguration<CVTepTin>
{
    public void Configure(EntityTypeBuilder<CVTepTin> builder)
    {
        builder.ToTable("CVTepTin");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ObjectKey).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.TenFile).IsRequired().HasMaxLength(255);
        builder.Property(x => x.ContentType).IsRequired().HasMaxLength(255);
        builder.Property(x => x.Sha256).HasMaxLength(64);
        builder.HasIndex(x => x.ObjectKey).IsUnique();
        builder.HasIndex(x => new { x.CVUngVienId, x.LoaiTep });
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.TepTins)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
