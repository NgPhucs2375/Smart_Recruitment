using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KyNangConfiguration : IEntityTypeConfiguration<kyNang>
    {
        public void Configure(EntityTypeBuilder<kyNang> builder)
        {
            builder.ToTable("kyNang");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.tenKyNang).IsRequired().HasMaxLength(255);
            builder.HasIndex(x => x.tenKyNang).IsUnique();
            builder.Property(x => x.moTa).HasMaxLength(500);
        }
    }
}