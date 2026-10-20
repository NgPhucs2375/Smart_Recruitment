using Domain.Common;
using System.Collections.Generic;

namespace Domain.Entities;

public class CVPhienBan : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }
    public int SoPhienBan { get; set; }
    public int? TepGocId { get; set; }
    public int? TepDaSinhId { get; set; }
    public string? TemplateId { get; set; }
    public string? TemplateVersion { get; set; }
    /// <summary>Ảnh chụp delta tùy biến giao diện tại thời điểm lưu phiên bản.</summary>
    public string? CauHinhJson { get; set; }

    public CVUngVien CVUngVien { get; set; }
    public CVTepTin? TepGoc { get; set; }
    public CVTepTin? TepDaSinh { get; set; }
    public ICollection<DonUngTuyen> DonUngTuyens { get; set; } = new List<DonUngTuyen>();
}
