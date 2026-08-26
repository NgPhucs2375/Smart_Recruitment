using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KyNangTinTuyenDungConfiguration : IEntityTypeConfiguration<KyNangTinTuyenDung>
    {
        public void Configure(EntityTypeBuilder<KyNangTinTuyenDung> builder)
        {
            builder.ToTable("KyNangTinTuyenDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.MucDoYeuCau).HasMaxLength(50);

            builder.HasOne(x => x.TinTuyenDung)
                   .WithMany(x => x.KyNangTinTuyenDungs)
                   .HasForeignKey(x => x.TinTuyenDungId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.KyNang)
                   .WithMany(x => x.KyNangTinTuyenDungs)
                   .HasForeignKey(x => x.KyNangId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}