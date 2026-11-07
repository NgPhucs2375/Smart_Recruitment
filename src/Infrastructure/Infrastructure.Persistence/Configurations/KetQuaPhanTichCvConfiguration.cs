using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KetQuaPhanTichCvConfiguration : IEntityTypeConfiguration<KetQuaPhanTichCv>
    {
        public void Configure(EntityTypeBuilder<KetQuaPhanTichCv> builder)
        {
            builder.ToTable("KetQuaPhanTichCv");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.CVUngVien)
                   .WithMany(x => x.KetQuaPhanTichCvs)
                   .HasForeignKey(x => x.CVUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(x => x.NhanXet).HasColumnType("text");
            builder.Property(x => x.DiemManh).HasColumnType("text");
            builder.Property(x => x.DiemYeu).HasColumnType("text");
            builder.Property(x => x.GoiY).HasColumnType("text");
            builder.Property(x => x.MatchingVersion).HasMaxLength(32);
            builder.Property(x => x.DaDanhGiaBangAi).HasDefaultValue(false);

            // Xoá tin không được xoá CV; đánh giá cũ vẫn giữ nhận xét,
            // chỉ mất tham chiếu tới tin.
            builder.HasOne(x => x.TinTuyenDung)
                   .WithMany()
                   .HasForeignKey(x => x.TinTuyenDungId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}