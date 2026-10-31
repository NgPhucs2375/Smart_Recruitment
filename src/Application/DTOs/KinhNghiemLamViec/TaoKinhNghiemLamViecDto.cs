#nullable enable

namespace Application.DTOs.KinhNghiemLamViec
{
    public class TaoKinhNghiemLamViecDto
    {
        public string? TenCongTy { get; set; }

        public string? DiaChi { get; set; }

        public string? TuNgay { get; set; }

        public string? DenNgay { get; set; }

        public string? MoTa { get; set; }

        public bool IsHienTai { get; set; }

        /// <summary>Hồ sơ đích. null = hồ sơ của chính user đang đăng nhập.</summary>
        public int? HoSoUngVienId { get; set; }
    }
}
