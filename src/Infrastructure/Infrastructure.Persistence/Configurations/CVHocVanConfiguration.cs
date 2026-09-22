using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CVHocVanConfiguration : IEntityTypeConfiguration<CVHocVan>
{
    public void Configure(EntityTypeBuilder<CVHocVan> builder)
    {
        builder.ToTable("CVHocVan");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Truong).IsRequired().HasMaxLength(255);
        builder.Property(x => x.ChuyenNganh).HasMaxLength(255);
        builder.Property(x => x.MoTa).HasColumnType("text");
        builder.HasIndex(x => new { x.CVUngVienId, x.ThuTu });
        builder.HasOne(x => x.CVUngVien)
            .WithMany(x => x.HocVans)
            .HasForeignKey(x => x.CVUngVienId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
