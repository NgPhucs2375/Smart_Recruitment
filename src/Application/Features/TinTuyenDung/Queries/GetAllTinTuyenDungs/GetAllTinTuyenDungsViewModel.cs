namespace Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs
{
    public class GetAllTinTuyenDungsViewModel
    {
        public int Id { get; set; }
        public string TieuDe { get; set; }
        public string DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public string TrangThai { get; set; }
        public System.DateTime? NgayHetHan { get; set; }
        public int NguoiDangTinId { get; set; }
        public int DoanhNghiepId { get; set; }
    }
}
