using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DonUngTuyenConfiguration : IEntityTypeConfiguration<DonUngTuyen>
    {
        public void Configure(EntityTypeBuilder<DonUngTuyen> builder)
        {
            builder.ToTable("DonUngTuyen");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TrangThai).IsRequired().HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.HoSoUngVien)
                   .WithMany(x => x.DonUngTuyens)
                   .HasForeignKey(x => x.HoSoUngVienId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.TinTuyenDung)
                   .WithMany(x => x.DonUngTuyens)
                   .HasForeignKey(x => x.TinTuyenDungId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.CVUngVien)
                   .WithMany()
                   .HasForeignKey(x => x.CVUngVienId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}