using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class HoSoUngVienConfiguration : IEntityTypeConfiguration<HoSoUngVien>
    {
        public void Configure(EntityTypeBuilder<HoSoUngVien> builder)
        {
            builder.ToTable("HoSoUngVien");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.HoTen).IsRequired().HasMaxLength(255);
            builder.Property(x => x.SDT).HasMaxLength(20);
            builder.Property(x => x.GioiTinh).HasMaxLength(10);
            builder.Property(x => x.DiaChi).HasMaxLength(255);

            // Quan hệ 1 - 1 với NguoiDung
            builder.HasOne(x => x.NguoiDung)
                   .WithOne(x => x.HoSoUngVien)
                   .HasForeignKey<HoSoUngVien>(x => x.NguoiDungId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}