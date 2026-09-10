using Domain.Enums;

namespace Application.DTOs.ThongBao
{
    public class ThongBaoDTO
    {
        public int Id { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string NoiDung { get; set; } = string.Empty;
        public LoaiThongBao LoaiThongBao { get; set; }
        public bool IsRead { get; set; } 
        public DateTime NgayTao { get; set; } 
        public NotificationAudienceType AudienceType { get; set; }
        public int? NguoiDungId { get; set; }
        public int? DoanhNghiepId { get; set; }
        public string? Role { get; set; }

        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
    }
}