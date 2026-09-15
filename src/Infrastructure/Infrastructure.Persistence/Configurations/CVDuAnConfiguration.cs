using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVDuAnConfiguration : IEntityTypeConfiguration<CVDuAn>
{
    public void Configure(EntityTypeBuilder<CVDuAn> builder)
    {
        builder.ToTable("CVDuAn");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenDuAn).IsRequired().HasMaxLength(255);
        builder.Property(x => x.VaiTro).HasMaxLength(255);
        builder.Property(x => x.Link).HasMaxLength(500);
        builder.Property(x => x.MoTa).HasColumnType("text");
        builder.HasIndex(x => new { x.CVUngVienId, x.ThuTu });
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.DuAns)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
