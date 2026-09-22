using Domain.Common;
using Domain.Enums;

namespace Domain.Entities
{
    public class QuyTacKiemDuyetTin : AuditableBaseEntity
    {
        public string TuKhoa { get; set; }
        public LoaiQuyTacKiemDuyet Loai { get; set; }
        public int DiemTru { get; set; }
        public string MoTa { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
