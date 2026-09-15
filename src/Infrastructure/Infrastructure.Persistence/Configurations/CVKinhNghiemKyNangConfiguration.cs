using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVKinhNghiemKyNangConfiguration : IEntityTypeConfiguration<CVKinhNghiemKyNang>
{
    public void Configure(EntityTypeBuilder<CVKinhNghiemKyNang> builder)
    {
        builder.ToTable("CVKinhNghiemKyNang");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenKyNang).IsRequired().HasMaxLength(255);
        builder.HasIndex(x => x.CVKinhNghiemLamViecId);
        builder.HasOne(x => x.CVKinhNghiemLamViec)
            .WithMany(x => x.KyNangs)
            .HasForeignKey(x => x.CVKinhNghiemLamViecId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.KyNang)
            .WithMany(x => x.CVKinhNghiemKyNangs)
            .HasForeignKey(x => x.KyNangId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
