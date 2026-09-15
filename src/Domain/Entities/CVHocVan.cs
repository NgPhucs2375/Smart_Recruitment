using Domain.Common;
using Domain.Entities;

public class CVHocVan : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }

    public string Truong { get; set; }

    public string? ChuyenNganh { get; set; }

    // YYYY-MM
    public short? TuThang { get; set; }
    public short? TuNam { get; set; }

    public short? DenThang { get; set; }
    public short? DenNam { get; set; }

    public bool IsHienTai { get; set; }

    public string? MoTa { get; set; }

    // Thứ tự hiển thị trong CV
    public int ThuTu { get; set; }

    public CVUngVien CVUngVien { get; set; }
}