using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class ThongBaoConfiguration : IEntityTypeConfiguration<thongBao>
    {
        public void Configure(EntityTypeBuilder<thongBao> builder)
        {
            builder.ToTable("thongBao");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.tieuDe).IsRequired().HasMaxLength(255);
            builder.Property(x => x.noiDung).IsRequired();
            builder.Property(x => x.loaiThongBao).IsRequired().HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.nguoiDungs)
                   .WithMany()
                   .HasForeignKey(x => x.nguoiDungId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}