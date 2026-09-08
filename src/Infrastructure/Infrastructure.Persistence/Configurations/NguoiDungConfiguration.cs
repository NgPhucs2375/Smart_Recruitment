using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class NguoiDungConfiguration : IEntityTypeConfiguration<NguoiDung>
    {
        public void Configure(EntityTypeBuilder<NguoiDung> builder)
        {

            builder.ToTable("NguoiDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.ApplicationUserId)
              .IsRequired()
              .HasMaxLength(450);

            builder.HasIndex(x=> x.ApplicationUserId)
              .IsUnique();

            builder.Property(x => x.VaiTro)
                   .IsRequired()
                   .HasConversion<string>()
                   .HasMaxLength(50);
        }
    }
}