using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class CvUngVienConfiguration : IEntityTypeConfiguration<CVUngVien>
    {
        public void Configure(EntityTypeBuilder<CVUngVien> builder)
        {
            builder.ToTable("CVUngVien");
            builder.HasKey(x => x.Id);

            // Tên file và URL có thể null ở thời điểm khởi tạo bằng tay (chưa render PDF)
            builder.Property(x => x.TenFile)
                   .IsRequired(false)
                   .HasMaxLength(255);

            builder.Property(x => x.FileUrl)
                   .IsRequired(false)
                   .HasMaxLength(500);

            // Cột lưu cấu trúc form CV dạng jsonb của PostgreSQL
            builder.Property(x => x.NoiDungJson)
                   .HasColumnType("jsonb")
                   .IsRequired();

            // Template tùy chọn khi tạo form thủ công
            builder.Property(x => x.TemplateId)
                   .IsRequired(false);

            // Quan hệ với Hồ sơ ứng viên
            builder.HasOne(x => x.HoSoUngVien)
                   .WithMany(x => x.CVUngViens)
                   .HasForeignKey(x => x.HoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}