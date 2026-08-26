using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DanhGiaConfiguration : IEntityTypeConfiguration<DanhGia>
    {
        public void Configure(EntityTypeBuilder<DanhGia> builder)
        {
            builder.ToTable("DanhGia");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.KetLuan)
                   .HasMaxLength(255);

            builder.Property(x => x.NoiDungPhanHoi)
                   .HasColumnType("text");

            builder.Property(x => x.NgayPhanHoi)
                   .IsRequired(false);

            // Quan hệ 1 - N với DonUngTuyen (Một đơn ứng tuyển có thể có các lượt đánh giá/phản hồi)
            builder.HasOne(x => x.DonUngTuyen)
                   .WithMany(x => x.DanhGias)
                   .HasForeignKey(x => x.DonUngTuyenId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}