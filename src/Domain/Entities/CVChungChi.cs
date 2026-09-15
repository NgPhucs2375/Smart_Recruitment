using System;
using Domain.Common;
using Domain.Entities;

public class CVChungChi : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }

    public string TenChungChi { get; set; }

    public string? DonViCap { get; set; }

    public DateTime? NgayCap { get; set; }

    public DateTime? NgayHetHan { get; set; }

    public string? MaXacMinh { get; set; }

    public string? CredentialUrl { get; set; }

    public int ThuTu { get; set; }

    public CVUngVien CVUngVien { get; set; }
}