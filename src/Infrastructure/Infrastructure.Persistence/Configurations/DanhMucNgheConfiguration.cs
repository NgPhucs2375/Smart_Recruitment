using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DanhMucNgheConfiguration : IEntityTypeConfiguration<danhMucNghe>
    {
        public void Configure(EntityTypeBuilder<danhMucNghe> builder)
        {
            builder.ToTable("danhMucNghe");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.tenNghe).IsRequired().HasMaxLength(255);
            builder.HasIndex(x => x.tenNghe).IsUnique();
            builder.Property(x => x.moTa).HasMaxLength(500);
        }
    }
}