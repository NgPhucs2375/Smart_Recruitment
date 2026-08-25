using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class HoSoUngVienConfiguration : IEntityTypeConfiguration<hoSoUngVien>
    {
        public void Configure(EntityTypeBuilder<hoSoUngVien> builder)
        {
            builder.ToTable("hoSoUngVien");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.hoTen).IsRequired().HasMaxLength(255);
            builder.Property(x => x.SDT).HasMaxLength(20);
            builder.Property(x => x.gioiTinh).HasMaxLength(10);
            builder.Property(x => x.diaChi).HasMaxLength(255);

            // Quan hệ 1 - 1 với NguoiDung
            builder.HasOne(x => x.nguoiDungs)
                   .WithOne(x => x.hoSoUngViens)
                   .HasForeignKey<hoSoUngVien>(x => x.nguoiDungId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}