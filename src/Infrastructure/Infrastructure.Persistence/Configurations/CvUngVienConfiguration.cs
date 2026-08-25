using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class CvUngVienConfiguration : IEntityTypeConfiguration<cvUngVien>
    {
        public void Configure(EntityTypeBuilder<cvUngVien> builder)
        {
            builder.ToTable("cvUngVien");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.tenFile).IsRequired().HasMaxLength(255);
            builder.Property(x => x.fileUrl).IsRequired().HasMaxLength(500);

            builder.HasOne(x => x.hoSoUngViens)
                   .WithMany(x => x.cvUngViens)
                   .HasForeignKey(x => x.hoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}