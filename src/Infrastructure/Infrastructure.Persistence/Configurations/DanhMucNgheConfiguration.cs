using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DanhMucNgheConfiguration : IEntityTypeConfiguration<DanhMucNghe>
    {
        public void Configure(EntityTypeBuilder<DanhMucNghe> builder)
        {
            builder.ToTable("DanhMucNghe");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenNghe).IsRequired().HasMaxLength(255);
            builder.HasIndex(x => x.TenNghe).IsUnique();
            builder.Property(x => x.MoTa).HasMaxLength(500);
        }
    }
}