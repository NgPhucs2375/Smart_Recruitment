using System.Collections.Generic;
using Domain.Common;
using Domain.Entities;

public class CVKinhNghiemLamViec : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }

    public string CongTy { get; set; }
    public string ChucDanh { get; set; }

    public int? TuThang { get; set; }
    public int? TuNam { get; set; }

    public int? DenThang { get; set; }
    public int? DenNam { get; set; }

    public bool IsHienTai { get; set; }

    public string? MoTa { get; set; }

    public int ThuTu { get; set; }

    public CVUngVien CVUngVien { get; set; }

    public ICollection<CVKinhNghiemKyNang> KyNangs { get; set; }
}