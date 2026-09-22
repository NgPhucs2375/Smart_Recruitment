using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class HoSoNhaTuyenDungConfiguration : IEntityTypeConfiguration<HoSoNhaTuyenDung>
    {
        public void Configure(EntityTypeBuilder<HoSoNhaTuyenDung> builder)
        {
            builder.ToTable("HoSoNhaTuyenDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.HoTen).IsRequired().HasMaxLength(255);
            builder.Property(x => x.SDT).HasMaxLength(20);
            builder.Property(x => x.ChucVu).HasMaxLength(100);

            // Quan hệ 1 - 1 với NguoiDung
            builder.HasOne(x => x.NguoiDung)
                   .WithOne(x => x.HoSoNhaTuyenDung)
                   .HasForeignKey<HoSoNhaTuyenDung>(x => x.NguoiDungId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Quan hệ 1 - N với DoanhNghiep
            builder.HasOne(x => x.DoanhNghiep)
                   .WithMany(x => x.HoSoNhaTuyenDungs)
                   .HasForeignKey(x => x.DoanhNghiepId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}