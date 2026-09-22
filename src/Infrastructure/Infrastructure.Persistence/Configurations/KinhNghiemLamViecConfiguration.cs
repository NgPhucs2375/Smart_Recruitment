using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class KinhNghiemLamViecConfiguration : IEntityTypeConfiguration<KinhNghiemLamViec>
{
    public void Configure(EntityTypeBuilder<KinhNghiemLamViec> builder)
    {
        builder.ToTable("KinhNghiemLamViec");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenCongTy).IsRequired().HasMaxLength(255);
        builder.Property(x => x.DiaChi).HasMaxLength(500);
        builder.Property(x => x.MoTa).HasColumnType("text");
        builder.HasIndex(x => x.HoSoUngVienId);
        builder.HasOne(x => x.HoSoUngVien)
            .WithMany(x => x.KinhNghiemLamViecs)
            .HasForeignKey(x => x.HoSoUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
