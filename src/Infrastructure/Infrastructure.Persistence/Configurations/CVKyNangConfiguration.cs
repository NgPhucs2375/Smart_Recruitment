using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVKyNangConfiguration : IEntityTypeConfiguration<CVKyNang>
{
    public void Configure(EntityTypeBuilder<CVKyNang> builder)
    {
        builder.ToTable("CVKyNang");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenKyNang).IsRequired().HasMaxLength(255);
        builder.Property(x => x.MucDoThanhThao).HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(x => new { x.CVUngVienId, x.ThuTu });
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.KyNangs)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.KyNang)
            .WithMany(x => x.CVKyNangs)
            .HasForeignKey(x => x.KyNangId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
