using Domain.Common;
using Domain.Entities;
using Domain.Enums;

public class CVKyNang : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }

    public int? KyNangId { get; set; }

    public string TenKyNang { get; set; }

    public MucDo? MucDoThanhThao { get; set; }

    public float? SoNamKinhNghiem { get; set; }

    public int ThuTu { get; set; }

    public CVUngVien CVUngVien { get; set; }

    public KyNang? KyNang { get; set; }
}