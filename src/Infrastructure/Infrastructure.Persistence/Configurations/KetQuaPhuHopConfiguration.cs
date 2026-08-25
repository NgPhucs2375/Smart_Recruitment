using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KetQuaPhuHopConfiguration : IEntityTypeConfiguration<ketQuaPhuHop>
    {
        public void Configure(EntityTypeBuilder<ketQuaPhuHop> builder)
        {
            builder.ToTable("ketQuaPhuHop");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.phanLoai).HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.hoSoUngViens)
                   .WithMany()
                   .HasForeignKey(x => x.hoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.tinTuyenDungs)
                   .WithMany()
                   .HasForeignKey(x => x.tinTuyenDungId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}