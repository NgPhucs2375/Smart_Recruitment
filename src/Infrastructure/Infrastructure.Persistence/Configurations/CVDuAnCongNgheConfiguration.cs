using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVDuAnCongNgheConfiguration : IEntityTypeConfiguration<CVDuAnCongNghe>
{
    public void Configure(EntityTypeBuilder<CVDuAnCongNghe> builder)
    {
        builder.ToTable("CVDuAnCongNghe");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenCongNghe).IsRequired().HasMaxLength(255);
        builder.HasIndex(x => x.CVDuAnId);
        builder.HasOne(x => x.CVDuAn)
            .WithMany(x => x.CongNghes)
            .HasForeignKey(x => x.CVDuAnId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.KyNang)
            .WithMany(x => x.CVDuAnCongNghes)
            .HasForeignKey(x => x.KyNangId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
