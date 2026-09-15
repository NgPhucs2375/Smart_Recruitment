using System.Collections.Generic;
using Domain.Common;
using Domain.Entities;

public class CVDuAn : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }

    public string TenDuAn { get; set; }

    public string? VaiTro { get; set; }

    public string? Link { get; set; }

    public string? MoTa { get; set; }

    public short? TuThang { get; set; }
    public short? TuNam { get; set; }

    public short? DenThang { get; set; }
    public short? DenNam { get; set; }

    public bool IsHienTai { get; set; }

    public int ThuTu { get; set; }

    public CVUngVien CVUngVien { get; set; }

    public ICollection<CVDuAnCongNghe> CongNghes { get; set; }
        = new List<CVDuAnCongNghe>();
}