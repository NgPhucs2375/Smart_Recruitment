using Domain.Common;
using Domain.Entities;

public class CVKinhNghiemKyNang : AuditableBaseEntity
{
    public int CVKinhNghiemLamViecId { get; set; }

    public int? KyNangId { get; set; }

    // Snapshot tên skill lúc import CV
    public string TenKyNang { get; set; }

    public CVKinhNghiemLamViec CVKinhNghiemLamViec { get; set; }

    public KyNang? KyNang { get; set; }
}