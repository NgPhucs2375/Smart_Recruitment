#nullable enable

namespace Application.DTOs.KinhNghiemLamViec
{
    public class CapNhatKinhNghiemLamViecDto
    {
        public int Id { get; set; }

        public string? TenCongTy { get; set; }

        public string? DiaChi { get; set; }

        public string? TuNgay { get; set; }

        public string? DenNgay { get; set; }

        public string? MoTa { get; set; }

        public bool IsHienTai { get; set; }
    }
}
