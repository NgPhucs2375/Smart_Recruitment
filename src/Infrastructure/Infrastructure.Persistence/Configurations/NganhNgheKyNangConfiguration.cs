using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class NganhNgheKyNangConfiguration : IEntityTypeConfiguration<NganhNgheKyNang>
{
    public void Configure(EntityTypeBuilder<NganhNgheKyNang> builder)
    {
        builder.ToTable("NganhNgheKyNang");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.DanhMucNgheId, x.KyNangId }).IsUnique();
        builder.HasOne(x => x.DanhMucNghe)
            .WithMany()
            .HasForeignKey(x => x.DanhMucNgheId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.KyNang)
            .WithMany()
            .HasForeignKey(x => x.KyNangId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
