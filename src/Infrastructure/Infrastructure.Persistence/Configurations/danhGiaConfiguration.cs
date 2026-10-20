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

            // Một đơn ứng tuyển chỉ có một đánh giá: unique index biến
            // check-then-insert ở Create/UpdateDanhGia thành guard chống race.
            builder.HasIndex(x => x.DonUngTuyenId)
                   .IsUnique();

            // Quan hệ 1 - 1 với DonUngTuyen (Một đơn ứng tuyển có tối đa một đánh giá/phản hồi)
            builder.HasOne(x => x.DonUngTuyen)
                   .WithMany(x => x.DanhGias)
                   .HasForeignKey(x => x.DonUngTuyenId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}