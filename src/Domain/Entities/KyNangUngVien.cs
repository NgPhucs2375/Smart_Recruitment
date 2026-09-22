using Domain.Common;
using Domain.Entities;
using Domain.Enums;

public class KyNangUngVien : AuditableBaseEntity
{
    public int HoSoUngVienId { get; set; }

    public int KyNangId { get; set; }

    public float? SoNamKinhNghiem { get; set; }

    public MucDo MucDoThongThao { get; set; }

    public HoSoUngVien HoSoUngVien { get; set; }

    public KyNang KyNang { get; set; }
}