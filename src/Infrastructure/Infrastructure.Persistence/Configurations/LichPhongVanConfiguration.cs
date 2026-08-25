using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class LichPhongVanConfiguration : IEntityTypeConfiguration<lichPhongVan>
    {
        public void Configure(EntityTypeBuilder<lichPhongVan> builder)
        {
            builder.ToTable("lichPhongVan");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.diaDiem).IsRequired().HasMaxLength(255);
            builder.Property(x => x.trangThai).IsRequired().HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.donUngTuyens)
                   .WithMany(x => x.lichPhongVans)
                   .HasForeignKey(x => x.donUngTuyenId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}