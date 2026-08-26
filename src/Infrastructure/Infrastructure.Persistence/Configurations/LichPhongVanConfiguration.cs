using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class LichPhongVanConfiguration : IEntityTypeConfiguration<LichPhongVan>
    {
        public void Configure(EntityTypeBuilder<LichPhongVan> builder)
        {
            builder.ToTable("LichPhongVan");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.DiaDiem).IsRequired().HasMaxLength(255);
            builder.Property(x => x.TrangThai).IsRequired().HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.DonUngTuyen)
                   .WithMany(x => x.LichPhongVans)
                   .HasForeignKey(x => x.DonUngTuyenId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}