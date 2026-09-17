using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class CVTepTin : AuditableBaseEntity
{
    public int CVUngVienId { get; set; }
    public LoaiTepCv LoaiTep { get; set; }
    public string ObjectKey { get; set; }
    public string TenFile { get; set; }
    public string ContentType { get; set; }
    public long KichThuoc { get; set; }
    public string? Sha256 { get; set; }

    public CVUngVien CVUngVien { get; set; }
}
