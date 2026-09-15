using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CvUngVienConfiguration : IEntityTypeConfiguration<CVUngVien>
{
    public void Configure(EntityTypeBuilder<CVUngVien> builder)
    {
        builder.ToTable("CVUngVien");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenFile)
            .IsRequired(false)
            .HasMaxLength(255);
        builder.Property(x => x.FileUrl)
            .IsRequired(false)
            .HasMaxLength(500);
        builder.Property(x => x.TemplateId)
            .IsRequired(false)
            .HasMaxLength(100);
        builder.Property(x => x.PhuongThucTao)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasOne(x => x.HoSoUngVien)
            .WithMany(x => x.CVUngViens)
            .HasForeignKey(x => x.HoSoUngVienId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.HoSoUngVienId, x.IsDefault });
    }
}
