using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVChungChiConfiguration : IEntityTypeConfiguration<CVChungChi>
{
    public void Configure(EntityTypeBuilder<CVChungChi> builder)
    {
        builder.ToTable("CVChungChi");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenChungChi).IsRequired().HasMaxLength(255);
        builder.Property(x => x.DonViCap).HasMaxLength(255);
        builder.Property(x => x.MaXacMinh).HasMaxLength(255);
        builder.Property(x => x.CredentialUrl).HasMaxLength(500);
        builder.HasIndex(x => new { x.CVUngVienId, x.ThuTu });
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.ChungChis)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
