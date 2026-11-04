using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class LichSuTrangThaiDonUngTuyenConfiguration
        : IEntityTypeConfiguration<LichSuTrangThaiDonUngTuyen>
    {
        public void Configure(EntityTypeBuilder<LichSuTrangThaiDonUngTuyen> builder)
        {
            builder.ToTable("LichSuTrangThaiDonUngTuyen");
            builder.HasKey(x => x.Id);

            // Same storage as DonUngTuyen.TrangThai (enum name text) so the two
            // columns can be compared/joined without a cast.
            builder.Property(x => x.TrangThaiTruoc).IsRequired().HasConversion<string>().HasMaxLength(50);
            builder.Property(x => x.TrangThaiSau).IsRequired().HasConversion<string>().HasMaxLength(50);
            builder.Property(x => x.Trigger).HasConversion<string>().HasMaxLength(50);
            // Lý do từ chối do người dùng nhập tự do -> để text, không cắt ô.
            builder.Property(x => x.GhiChu);

            builder.HasIndex(x => new { x.DonUngTuyenId, x.Created });

            builder.HasOne(x => x.DonUngTuyen)
                   .WithMany(x => x.LichSuTrangThais)
                   .HasForeignKey(x => x.DonUngTuyenId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Xoá tài khoản không được xoá dấu vết ai đã thao tác trên đơn.
            builder.HasOne(x => x.NguoiThucHien)
                   .WithMany()
                   .HasForeignKey(x => x.NguoiThucHienId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
