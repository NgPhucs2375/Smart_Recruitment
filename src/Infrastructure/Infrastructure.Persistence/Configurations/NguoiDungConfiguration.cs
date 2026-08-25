using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class NguoiDungConfiguration : IEntityTypeConfiguration<nguoiDung>
    {
        public void Configure(EntityTypeBuilder<nguoiDung> builder)
        {

            builder.ToTable("nguoiDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.ApplicationUserId)
              .IsRequired()
              .HasMaxLength(450);

            builder.HasIndex(x=> x.ApplicationUserId)
              .IsUnique();

            builder.Property(x => x.vaiTro)
                   .IsRequired()
                   .HasConversion<string>()
                   .HasMaxLength(50);
        }
    }
}