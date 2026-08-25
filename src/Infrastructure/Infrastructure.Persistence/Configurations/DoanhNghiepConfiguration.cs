using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DoanhNghiepConfiguration : IEntityTypeConfiguration<doanhNghiep>
    {
        public void Configure(EntityTypeBuilder<doanhNghiep> builder)
        {
            builder.ToTable("doanhNghiep");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.tenDoanhNghiep)
                   .IsRequired()
                   .HasMaxLength(255);

            builder.Property(x => x.website).HasMaxLength(255);
            builder.Property(x => x.diaChi).HasMaxLength(255);
            builder.Property(x => x.logoUrl).HasMaxLength(500);
        }
    }
}