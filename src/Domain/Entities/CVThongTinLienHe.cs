using System;
using Domain.Common;

namespace Domain.Entities
{
    public class CVThongTinLienHe: AuditableBaseEntity
    {
    public int CVUngVienId { get; set; }

    public string HoTen { get; set; }

    public string? Email { get; set; }
    public string? SDT { get; set; }

    public string? DiaChi { get; set; }

    public string? GitHub { get; set; }
    public string? LinkedIn { get; set; }
    public string? Portfolio { get; set; }

    public string? GioiTinh { get; set; }
    public DateTime? NgaySinh { get; set; }

    public string? ViTriUngTuyen { get; set; }

    public decimal? MucLuongMongMuon { get; set; }

    public string? GioiThieuBanThan { get; set; }

    public string? AnhDaiDienUrl { get; set; }

    public CVUngVien CVUngVien { get; set; }    }
}
