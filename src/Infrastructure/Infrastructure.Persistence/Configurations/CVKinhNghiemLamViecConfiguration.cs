using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVKinhNghiemLamViecConfiguration : IEntityTypeConfiguration<CVKinhNghiemLamViec>
{
    public void Configure(EntityTypeBuilder<CVKinhNghiemLamViec> builder)
    {
        builder.ToTable("CVKinhNghiemLamViec");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CongTy).IsRequired().HasMaxLength(255);
        builder.Property(x => x.ChucDanh).IsRequired().HasMaxLength(255);
        builder.Property(x => x.MoTa).HasColumnType("text");
        builder.HasIndex(x => new { x.CVUngVienId, x.ThuTu });
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.KinhNghiems)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
