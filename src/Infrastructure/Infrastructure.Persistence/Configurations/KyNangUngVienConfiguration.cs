using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class KyNangUngVienConfiguration : IEntityTypeConfiguration<KyNangUngVien>
{
    public void Configure(EntityTypeBuilder<KyNangUngVien> builder)
    {
        builder.ToTable("KyNangUngVien");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.MucDoThongThao)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();
        builder.HasIndex(x => new { x.HoSoUngVienId, x.KyNangId }).IsUnique();
        builder.HasOne(x => x.HoSoUngVien)
            .WithMany(x => x.KyNangUngViens)
            .HasForeignKey(x => x.HoSoUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.KyNang)
            .WithMany(x => x.KyNangUngViens)
            .HasForeignKey(x => x.KyNangId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
