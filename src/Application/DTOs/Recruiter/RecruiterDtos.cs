namespace Application.DTOs.Recruiter;

public sealed class RecruitmentJobOption
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class RecruitmentJobDetail
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTaCongViec { get; set; } = string.Empty;
    public string KinhNghiemYeuCau { get; set; } = string.Empty;
    public string YeuCauCongViec { get; set; } = string.Empty;
    public string QuyenLoi { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime? NgayHetHan { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class RecruitmentApplication
{
    public int DonUngTuyenId { get; set; }
    public int TinTuyenDungId { get; set; }
    public string TieuDeTin { get; set; } = string.Empty;
    public int CVUngVienId { get; set; }
    public int HoSoUngVienId { get; set; }
    public string HoTenUngVien { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public DateTime? NgayUngTuyen { get; set; }
    public int NguoiXuLyId { get; set; }
}

public sealed class ApplicationPipelineStage
{
    public string TrangThai { get; set; } = string.Empty;
    public int SoLuong { get; set; }
}

public sealed class RecruitmentOverview
{
    public int TongTin { get; set; }
    public int TinDangTuyen { get; set; }
    public int TongDon { get; set; }
    public int DonChoXuLy { get; set; }
}

public sealed class CompanyRecruitmentStats
{
    public int TinTao30Ngay { get; set; }
    public int DonNhan30Ngay { get; set; }
    public int DonPhuHop { get; set; }
    public int DonTuChoi { get; set; }
}

public sealed class CompanyMember
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ChucVu { get; set; } = string.Empty;
    public string VaiTro { get; set; } = string.Empty;
}

public sealed class RecruiterActivity
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public int TinDaDang { get; set; }
    public int DonDaXuLy { get; set; }
    public int DonDanhGiaPhuHop { get; set; }
    public int DonTuChoi { get; set; }
}
