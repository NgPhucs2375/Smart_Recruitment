using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KinhNghiemLamViecConfiguration : IEntityTypeConfiguration<KinhNghiemLamViec>
    {
        public void Configure(EntityTypeBuilder<KinhNghiemLamViec> builder)
        {
            builder.ToTable("KinhNghiemLamViec");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenCongTy)
                   .IsRequired()
                   .HasMaxLength(255);

            builder.Property(x => x.DiaChi)
                   .HasMaxLength(500);

            builder.Property(x => x.MoTa)
                   .HasColumnType("text");

            builder.Property(x => x.IsHienTai)
                   .HasDefaultValue(false);

            builder.Property(x => x.TuNgay)
                   .IsRequired(false);

            builder.Property(x => x.DenNgay)
                   .IsRequired(false);

            // Quan hệ 1 - N với HoSoUngVien (Một hồ sơ ứng viên có nhiều kinh nghiệm làm việc)
            builder.HasOne(x => x.HoSoUngVien)
                   .WithMany(x => x.KinhNghiemLamViecs)
                   .HasForeignKey(x => x.HoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}