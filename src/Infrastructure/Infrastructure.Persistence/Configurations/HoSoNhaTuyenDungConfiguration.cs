using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class HoSoNhaTuyenDungConfiguration : IEntityTypeConfiguration<hoSoNhaTuyenDung>
    {
        public void Configure(EntityTypeBuilder<hoSoNhaTuyenDung> builder)
        {
            builder.ToTable("hoSoNhaTuyenDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.hoTen).IsRequired().HasMaxLength(255);
            builder.Property(x => x.SDT).HasMaxLength(20);
            builder.Property(x => x.chucVu).HasMaxLength(100);

            // Quan hệ 1 - 1 với NguoiDung
            builder.HasOne(x => x.nguoiDungs)
                   .WithOne(x => x.hoSoNhaTuyenDungs)
                   .HasForeignKey<hoSoNhaTuyenDung>(x => x.nguoiDungId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Quan hệ 1 - N với DoanhNghiep
            builder.HasOne(x => x.doanhNghieps)
                   .WithMany(x => x.hoSoNhaTuyenDungs)
                   .HasForeignKey(x => x.doanhNghiepId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}