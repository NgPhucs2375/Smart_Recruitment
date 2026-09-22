using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KyNangConfiguration : IEntityTypeConfiguration<KyNang>
    {
        public void Configure(EntityTypeBuilder<KyNang> builder)
        {
            builder.ToTable("KyNang");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenKyNang).IsRequired().HasMaxLength(255);
            builder.HasIndex(x => x.TenKyNang).IsUnique();
            builder.Property(x => x.MoTa).HasMaxLength(500);
        }
    }
}