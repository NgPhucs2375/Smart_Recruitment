using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DoanhNghiepConfiguration : IEntityTypeConfiguration<DoanhNghiep>
    {
        public void Configure(EntityTypeBuilder<DoanhNghiep> builder)
        {
            builder.ToTable("DoanhNghiep");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenDoanhNghiep)
                   .IsRequired()
                   .HasMaxLength(255);

            builder.Property(x => x.Website).HasMaxLength(255);
            builder.Property(x => x.DiaChi).HasMaxLength(255);
            builder.Property(x => x.LogoUrl).HasMaxLength(500);

            // 1 DN chỉ có 1 NGUOI_DAI_DIEN (owner duy nhất).
            builder.HasOne(x => x.NguoiDaiDien)
                   .WithMany()
                   .HasForeignKey(x => x.NguoiDaiDienId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Postgres: unique index cho phép nhiều NULL, chỉ khóa trùng giá trị thật.
            builder.HasIndex(x => x.NguoiDaiDienId).IsUnique();
            builder.HasIndex(x => x.MaSoThue).IsUnique();
        }
    }
}