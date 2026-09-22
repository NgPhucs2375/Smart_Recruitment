using Domain.Common;
using Domain.Entities;

public class CVDuAnCongNghe : AuditableBaseEntity
{
    public int CVDuAnId { get; set; }

    public int? KyNangId { get; set; }

    public string TenCongNghe { get; set; }

    public CVDuAn CVDuAn { get; set; }

    public KyNang? KyNang { get; set; }
}