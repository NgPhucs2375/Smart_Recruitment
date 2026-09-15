using System;
using Domain.Common;
using Domain.Entities;

public class KinhNghiemLamViec : AuditableBaseEntity
{
    public int HoSoUngVienId { get; set; }

    public string TenCongTy { get; set; }

    public string? DiaChi { get; set; }

    public DateTime? TuNgay { get; set; }

    public DateTime? DenNgay { get; set; }

    public string? MoTa { get; set; }

    public bool IsHienTai { get; set; }

    public HoSoUngVien HoSoUngVien { get; set; }
}