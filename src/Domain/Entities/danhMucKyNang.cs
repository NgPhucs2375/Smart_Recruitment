using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Danh mục kỹ năng chuẩn hóa — từ điển tham chiếu duy nhất, không mang dữ liệu vận hành.
    /// Được tham chiếu bắt buộc (FK not null) bởi KyNangUngVien và KyNangTinTuyenDung
    /// — hai phía so khớp trong matching.
    /// Được tham chiếu tùy chọn (soft link, FK nullable) bởi các bảng snapshot của CV
    /// (CVKyNang, CVKinhNghiemKyNang, CVDuAnCongNghe): những bảng này giữ TenKyNang/TenCongNghe
    /// nguyên văn lúc parse và có thể chưa map về danh mục, nên đừng suy luận nghiệp vụ từ
    /// DanhMucKyNangId của chúng.
    /// </summary>
    public class DanhMucKyNang : AuditableBaseEntity
{
    public string TenKyNang { get; set; }

    public string? MoTa { get; set; }

    public ICollection<KyNangUngVien> KyNangUngViens { get; set; }

    public ICollection<KyNangTinTuyenDung> KyNangTinTuyenDungs { get; set; }

    public ICollection<CVKyNang> CVKyNangs { get; set; }

    public ICollection<CVDuAnCongNghe> CVDuAnCongNghes { get; set; }

    public ICollection<CVKinhNghiemKyNang> CVKinhNghiemKyNangs { get; set; }
}
}
