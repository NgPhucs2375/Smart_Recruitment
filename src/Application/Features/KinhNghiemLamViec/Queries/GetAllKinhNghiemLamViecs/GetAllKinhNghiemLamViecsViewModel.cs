using System;

namespace Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs
{
    public class GetAllKinhNghiemLamViecsViewModel
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public string TenCongTy { get; set; }
        public string DiaChi { get; set; }
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public string MoTa { get; set; }
        public bool IsHienTai { get; set; }
    }
}
