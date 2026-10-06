namespace Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs
{
    public class GetAllTinTuyenDungsViewModel
    {
        public int Id { get; set; }
        public int DanhMucNgheId { get; set; }
        public string TieuDe { get; set; }
        public string MoTaCongViec { get; set; }
        public string KinhNghiemYeuCau { get; set; }
        public string YeuCauCongViec { get; set; }
        public string QuyenLoi { get; set; }
        public string DiaDiemLamViec { get; set; }
        public string PhuongThucLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public string TrangThai { get; set; }
        public System.DateTime? NgayHetHan { get; set; }
        public int NguoiDangTinId { get; set; }
        public int DoanhNghiepId { get; set; }
        public string TenDoanhNghiep { get; set; }
        public List<string> KyNangs { get; set; } = new();
        public int SoLuongUngVien { get; set; }
        public System.DateTime Created { get; set; }
        public System.DateTime? LastModified { get; set; }
        public List<JobSkillViewModel> KyNangYeuCaus { get; set; } = new();
        public string GhiChuKiemDuyet { get; set; } = "";
        public string KetQuaSangLoc { get; set; } = "";
        public bool NguoiDaiDienDaDuyet { get; set; }
        public string VaiTroNguoiDang { get; set; } = "";
        public string WorkMode { get; set; }
        public string Level { get; set; }
        public string EmploymentType { get; set; }
    }
    public class JobSkillViewModel
    {
        public int KyNangId { get; set; }
        public string TenKyNang { get; set; } = "";
        public int MucDoYeuCau { get; set; }
    }
}
