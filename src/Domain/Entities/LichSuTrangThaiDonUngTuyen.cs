using Domain.Common;
using Domain.Enums;

namespace Domain.Entities
{
    /// <summary>
    /// Vệt kiểm toán trạng thái đơn ứng tuyển: một dòng cho mỗi lần đơn đổi trạng thái.
    /// Bảng only-append — không sửa, không xoá qua nghiệp vụ.
    /// </summary>
    public class LichSuTrangThaiDonUngTuyen : AuditableBaseEntity
    {
        public int DonUngTuyenId { get; set; }
        public TrangThaiDonUngTuyen TrangThaiTruoc { get; set; }
        public TrangThaiDonUngTuyen TrangThaiSau { get; set; }

        /// <summary>null = dòng mốc sinh ra khi nâng cấp, chưa có sự kiện chuyển trạng thái.</summary>
        public TriggerDonUngTuyen? Trigger { get; set; }

        /// <summary>null = hệ thống tự chuyển (tiếp nhận hồ sơ, cascade đóng tin).</summary>
        public int? NguoiThucHienId { get; set; }
        public string GhiChu { get; set; }

        public DonUngTuyen DonUngTuyen { get; set; }
        public NguoiDung NguoiThucHien { get; set; }
    }
}
