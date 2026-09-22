using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVThongTinLienHeConfiguration : IEntityTypeConfiguration<CVThongTinLienHe>
{
    public void Configure(EntityTypeBuilder<CVThongTinLienHe> builder)
    {
        builder.ToTable("CVThongTinLienHe");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.HoTen).IsRequired().HasMaxLength(255);
        builder.Property(x => x.Email).HasMaxLength(256);
        builder.Property(x => x.SDT).HasMaxLength(20);
        builder.Property(x => x.DiaChi).HasMaxLength(500);
        builder.Property(x => x.GitHub).HasMaxLength(500);
        builder.Property(x => x.LinkedIn).HasMaxLength(500);
        builder.Property(x => x.Portfolio).HasMaxLength(500);
        builder.Property(x => x.GioiTinh).HasMaxLength(20);
        builder.Property(x => x.ViTriUngTuyen).HasMaxLength(255);
        builder.Property(x => x.GioiThieuBanThan).HasColumnType("text");
        builder.Property(x => x.AnhDaiDienUrl).HasMaxLength(500);

        builder.HasOne(x => x.CVUngVien)
            .WithOne(x => x.ThongTinLienHe)
            .HasForeignKey<CVThongTinLienHe>(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
